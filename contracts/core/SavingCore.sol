// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IVaultManager.sol";
import "../utils/Base64.sol";

/// @title SavingCore
/// @author NFT-Powered Term Deposit Protocol
/// @notice Core contract for managing term deposits as NFT certificates
/// @dev Extends ERC721 for NFT minting, with Ownable and Pausable functionality
contract SavingCore is ERC721, ERC721URIStorage, Ownable, Pausable {
    /// @notice Number of seconds in a year (365 days)
    uint256 private constant SECONDS_PER_YEAR = 31536000;
    
    /// @notice Basis points divisor (10000 = 100%)
    uint256 private constant BASIS_POINTS = 10000;
    
    /// @notice Grace period for auto-renewal (3 days after maturity)
    uint256 private constant GRACE_PERIOD = 3 days;

    /// @notice The underlying ERC20 token (e.g., MockUSDC)
    IERC20 public immutable underlyingToken;
    
    /// @notice VaultManager contract for managing vault funds
    IVaultManager public immutable vaultManager;
    
    /// @notice Address receiving early withdrawal penalties
    address public feeReceiver;

    /// @notice Total number of plans created
    uint256 public planCount;
    
    /// @notice Total number of deposits opened
    uint256 public depositCount;

    /// @notice Mapping from plan ID to plan details
    mapping(uint256 => SavingPlan) public plans;
    
    /// @notice Mapping from deposit ID to deposit details
    mapping(uint256 => DepositInfo) public deposits;

    /// @notice Status of a deposit
    /// @dev Active: deposit is ongoing, Withdrawn: deposit has been withdrawn,
    ///      ManualRenewed: manually renewed, AutoRenewed: auto-renewed
    enum DepositStatus {
        Active,
        Withdrawn,
        ManualRenewed,
        AutoRenewed
    }

    /// @notice Plan structure defining term deposit parameters
    /// @param tenorDays Duration of the plan in days
    /// @param aprBps Annual percentage rate in basis points (100 = 1%)
    /// @param minDeposit Minimum deposit amount (in underlying token decimals)
    /// @param maxDeposit Maximum deposit amount (in underlying token decimals)
    /// @param penaltyBps Early withdrawal penalty in basis points
    /// @param enabled Whether the plan is available for new deposits
    struct SavingPlan {
        uint256 tenorDays;
        uint256 aprBps;
        uint256 minDeposit;
        uint256 maxDeposit;
        uint256 penaltyBps;
        bool enabled;
    }

    /// @notice Deposit information structure
    /// @param owner Address of the deposit owner
    /// @param planId ID of the plan used for this deposit
    /// @param principal Initial deposit amount
    /// @param maturityAt Unix timestamp when deposit matures
    /// @param aprBpsAtOpen APR snapshotted at opening (in basis points)
    /// @param penaltyBpsAtOpen Penalty snapshotted at opening (in basis points)
    /// @param status Current status of the deposit
    struct DepositInfo {
        address owner;
        uint256 planId;
        uint256 principal;
        uint256 maturityAt;
        uint256 aprBpsAtOpen;
        uint256 penaltyBpsAtOpen;
        DepositStatus status;
    }

    /// @notice Thrown when attempting to set a zero address
    error ZeroAddress();
    
    /// @notice Thrown when APR is set to zero
    error InvalidApr();
    
    /// @notice Thrown when tenor days is set to zero
    error InvalidTenor();
    
    /// @notice Thrown when accessing a non-existent plan
    error PlanDoesNotExist();
    
    /// @notice Thrown when attempting to use a disabled plan
    error PlanNotEnabled();
    
    /// @notice Thrown when deposit amount is below minimum
    error DepositBelowMinimum();
    
    /// @notice Thrown when deposit amount exceeds maximum
    error DepositAboveMaximum();
    
    /// @notice Thrown when attempting to withdraw before maturity
    error DepositNotMatured();
    
    /// @notice Thrown when attempting to withdraw an already withdrawn deposit
    error AlreadyWithdrawn();
    
    /// @notice Thrown when attempting to renew an already renewed deposit
    error AlreadyRenewed();
    
    /// @notice Thrown when caller is not the deposit owner
    error NotDepositOwner();
    
    /// @notice Thrown when attempting auto-renew before grace period ends
    error GracePeriodNotOver();
    
    /// @notice Thrown when vault has insufficient balance for interest payout
    error InsufficientVaultBalance();
    
    /// @notice Thrown when attempting operation while contract is paused
    error CoreIsPaused();

    /// @notice Emitted when a new savings plan is created
    /// @param planId ID of the newly created plan
    /// @param tenorDays Duration of the plan in days
    /// @param aprBps Annual percentage rate in basis points
    /// @param minDeposit Minimum deposit amount
    /// @param maxDeposit Maximum deposit amount
    /// @param penaltyBps Early withdrawal penalty in basis points
    event PlanCreated(uint256 indexed planId, uint256 tenorDays, uint256 aprBps, uint256 minDeposit, uint256 maxDeposit, uint256 penaltyBps);
    
    /// @notice Emitted when a plan's APR is updated
    /// @param planId ID of the plan
    /// @param newAprBps New APR in basis points
    event PlanUpdated(uint256 indexed planId, uint256 newAprBps);
    
    /// @notice Emitted when a plan is enabled
    /// @param planId ID of the plan
    event PlanEnabled(uint256 indexed planId);
    
    /// @notice Emitted when a plan is disabled
    /// @param planId ID of the plan
    event PlanDisabled(uint256 indexed planId);
    
    /// @notice Emitted when a new deposit is opened
    /// @param depositId ID of the new deposit
    /// @param owner Address of the depositor
    /// @param planId ID of the plan used
    /// @param principal Deposit amount
    /// @param maturityAt Unix timestamp when deposit matures
    event DepositOpened(uint256 indexed depositId, address indexed owner, uint256 indexed planId, uint256 principal, uint256 maturityAt);
    
    /// @notice Emitted when a deposit is withdrawn at maturity
    /// @param depositId ID of the deposit
    /// @param owner Address of the depositor
    /// @param principal Original deposit amount
    /// @param interest Interest earned
    /// @param total Total amount withdrawn (principal + interest)
    event Withdrawn(uint256 indexed depositId, address indexed owner, uint256 principal, uint256 interest, uint256 total);
    
    /// @notice Emitted when a deposit is withdrawn early
    /// @param depositId ID of the deposit
    /// @param owner Address of the depositor
    /// @param principal Original deposit amount
    /// @param penalty Penalty amount deducted
    /// @param received Amount received after penalty
    event EarlyWithdrawn(uint256 indexed depositId, address indexed owner, uint256 principal, uint256 penalty, uint256 received);
    
    /// @notice Emitted when a deposit is renewed
    /// @param oldDepositId ID of the original deposit
    /// @param newDepositId ID of the new deposit
    /// @param owner Address of the depositor
    /// @param newPrincipal New principal (old principal + interest)
    /// @param newPlanId ID of the plan used for renewal
    event Renewed(uint256 indexed oldDepositId, uint256 indexed newDepositId, address indexed owner, uint256 newPrincipal, uint256 newPlanId);
    
    /// @notice Emitted when the fee receiver is updated
    /// @param oldReceiver Previous fee receiver address
    /// @param newReceiver New fee receiver address
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);

    /// @notice Initialize the SavingCore contract
    /// @dev Sets up ERC721 NFT with name "Term Deposit Certificate" and symbol "TDC"
    /// @param _underlyingToken Address of the ERC20 token (e.g., USDC)
    /// @param _vaultManager Address of the VaultManager contract
    /// @param _feeReceiver Address that receives early withdrawal penalties
    constructor(
        address _underlyingToken,
        address _vaultManager,
        address _feeReceiver
    ) ERC721("Term Deposit Certificate", "TDC") Ownable(msg.sender) {
        if (_underlyingToken == address(0) || _vaultManager == address(0) || _feeReceiver == address(0)) {
            revert ZeroAddress();
        }
        underlyingToken = IERC20(_underlyingToken);
        vaultManager = IVaultManager(_vaultManager);
        feeReceiver = _feeReceiver;
    }

    /// @notice Base URI for computing tokenURI
    /// @dev Overrides ERC721URIStorage._baseURI()
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    /// @notice Generate SVG image for the NFT
    /// @param tokenId The ID of the token
    /// @return SVG as base64 encoded string
    function _generateSVG(uint256 tokenId) internal view returns (string memory) {
        DepositInfo memory deposit = deposits[tokenId];
        SavingPlan memory plan = plans[deposit.planId];
        
        // Format principal with 6 decimals (USDC)
        string memory principalStr = Strings.toString(deposit.principal / 1e6);
        string memory principalDecimals = Strings.toString(deposit.principal % 1e6);
        
        // Format APR
        string memory aprStr = Strings.toString(deposit.aprBpsAtOpen / 100);
        
        // Format tenor
        string memory tenorStr = Strings.toString(plan.tenorDays);
        
        // Format maturity date
        uint256 maturityYear = (deposit.maturityAt / 31536000) + 1970;
        uint256 remainder = deposit.maturityAt % 31536000;
        uint256 maturityMonth = (remainder / 2592000) + 1;
        uint256 maturityDay = ((remainder % 2592000) / 86400) + 1;
        
        string memory dateStr = string(abi.encodePacked(
            Strings.toString(maturityDay),
            "/",
            Strings.toString(maturityMonth),
            "/",
            Strings.toString(maturityYear)
        ));
        
        string memory statusStr = deposit.status == DepositStatus.Active ? "Active" : 
                                deposit.status == DepositStatus.Withdrawn ? "Withdrawn" :
                                deposit.status == DepositStatus.ManualRenewed ? "Renewed" : "Auto-Renewed";
        
        // SVG template
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">',
            '<defs>',
            '<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="300" rx="20" fill="url(#grad)"/>',
            '<rect x="20" y="20" width="360" height="260" rx="15" fill="rgba(255,255,255,0.1)"/>',
            '<text x="40" y="60" font-family="Arial" font-size="24" fill="white" font-weight="bold">NFT BANK</text>',
            '<text x="40" y="90" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.7)">Term Deposit Certificate</text>',
            '<rect x="40" y="120" width="320" height="1" fill="rgba(255,255,255,0.2)"/>',
            '<text x="40" y="150" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)">Principal</text>',
            '<text x="40" y="175" font-family="Arial" font-size="28" fill="white" font-weight="bold">', principalStr, '.', principalDecimals, ' USDC</text>',
            '<text x="40" y="205" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)">APR / Tenor</text>',
            '<text x="40" y="230" font-family="Arial" font-size="22" fill="#10B981" font-weight="bold">', aprStr, '% / ', tenorStr, ' Days</text>',
            '<text x="220" y="205" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)">Maturity</text>',
            '<text x="220" y="230" font-family="Arial" font-size="22" fill="white" font-weight="bold">', dateStr, '</text>',
            '<text x="40" y="265" font-family="Arial" font-size="12" fill="rgba(255,255,255,0.6)">#', Strings.toString(tokenId), ' | ', statusStr, '</text>',
            '</svg>'
        ));
        
        return svg;
    }

    /// @notice Generate full token URI with metadata for OpenSea/Rarible
    /// @param tokenId The ID of the token
    /// @return Base64 encoded JSON metadata
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        DepositInfo memory deposit = deposits[tokenId];
        SavingPlan memory plan = plans[deposit.planId];
        
        // Format principal
        string memory principalStr = Strings.toString(deposit.principal / 1e6);
        string memory principalDecimals = Strings.toString(deposit.principal % 1e6);
        string memory principalFull = string(abi.encodePacked(principalStr, ".", principalDecimals));
        
        // Format APR
        string memory aprStr = Strings.toString(deposit.aprBpsAtOpen / 100);
        
        // Format tenor
        string memory tenorStr = Strings.toString(plan.tenorDays);
        
        // Format maturity date (Unix timestamp for date display_type)
        string memory maturityUnix = Strings.toString(deposit.maturityAt);
        
        // Format maturity date for display
        uint256 maturityYear = (deposit.maturityAt / 31536000) + 1970;
        uint256 remainder = deposit.maturityAt % 31536000;
        uint256 maturityMonth = (remainder / 2592000) + 1;
        uint256 maturityDay = ((remainder % 2592000) / 86400) + 1;
        string memory maturityDate = string(abi.encodePacked(
            Strings.toString(maturityDay),
            "-",
            Strings.toString(maturityMonth),
            "-",
            Strings.toString(maturityYear)
        ));
        
        // Status string
        string memory statusStr = deposit.status == DepositStatus.Active ? "Active" : 
                                deposit.status == DepositStatus.Withdrawn ? "Withdrawn" :
                                deposit.status == DepositStatus.ManualRenewed ? "Manual Renewed" : "Auto Renewed";
        
        // Generate SVG and encode to base64
        string memory svg = _generateSVG(tokenId);
        string memory imageURI = string(abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(svg))
        ));
        
        // Build JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name": "NFT Bank Deposit #',
            Strings.toString(tokenId),
            '",',
            '"description": "Term Deposit Certificate - ',
            principalFull,
            ' USDC at ',
            aprStr,
            '% APR for ',
            tenorStr,
            ' days.Issued by NFT-Powered Term Deposit Protocol.",',
            '"image": "',
            imageURI,
            '",',
            '"external_url": "http://localhost:5173/dashboard",',
            '"attributes": [',
            '{"trait_type":"Principal","value":"',
            principalFull,
            '","display_type":"number"},',
            '{"trait_type":"APR","value":"',
            aprStr,
            '%","display_type":"string"},',
            '{"trait_type":"Tenor","value":"',
            tenorStr,
            ' days","display_type":"string"},',
            '{"trait_type":"Maturity Date","value":"',
            maturityUnix,
            '","display_type":"date"},',
            '{"trait_type":"Maturity Date (Readable)","value":"',
            maturityDate,
            '","display_type":"string"},',
            '{"trait_type":"Status","value":"',
            statusStr,
            '","display_type":"string"},',
            '{"trait_type":"Plan ID","value":',
            Strings.toString(deposit.planId),
            ',"display_type":"number"},',
            '{"trait_type":"Penalty","value":"',
            Strings.toString(deposit.penaltyBpsAtOpen / 100),
            '%","display_type":"string"}',
            ']'
            '}'
        ));
        
        // Return as base64 encoded data URI
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    /// @notice Returns the URI for a given token ID with full metadata
    /// @dev Overrides ERC721.tokenURI() and ERC721URIStorage.tokenURI()
    /// @param tokenId ID of the token to query
    /// @return The token URI string with metadata
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(deposits[tokenId].principal > 0, "Token does not exist");
        return _generateTokenURI(tokenId);
    }

    /// @notice Checks if the contract supports an interface
    /// @dev Overrides ERC721.supportsInterface() and ERC721URIStorage.supportsInterface()
    /// @param interfaceId The interface ID to check
    /// @return True if the interface is supported
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Calculate interest for a given principal, APR, and duration
    /// @dev Uses formula: (principal * aprBps * durationSeconds) / (SECONDS_PER_YEAR * BASIS_POINTS)
    ///      Includes precision fix to avoid truncation errors
    /// @param principal The deposit principal amount
    /// @param aprBps Annual percentage rate in basis points
    /// @param durationSeconds Duration in seconds
    /// @return The calculated interest amount (with proper rounding)
    function _calculateInterest(uint256 principal, uint256 aprBps, uint256 durationSeconds) internal pure returns (uint256) {
        // Use higher precision to avoid truncation
        // Add BASIS_POINTS/2 for rounding instead of truncation
        uint256 numerator = principal * aprBps * durationSeconds;
        uint256 denominator = SECONDS_PER_YEAR * BASIS_POINTS;
        return (numerator + denominator / 2) / denominator;
    }

    /// @notice Create a new savings plan
    /// @dev Only owner can call. Plan is created with enabled=false
    /// @param tenorDays Duration of the plan in days
    /// @param aprBps Annual percentage rate in basis points (100 = 1%)
    /// @param minDeposit Minimum deposit amount (in underlying token decimals)
    /// @param maxDeposit Maximum deposit amount (in underlying token decimals)
    /// @param penaltyBps Early withdrawal penalty in basis points
    /// @return planId The ID of the newly created plan
    function createPlan(
        uint256 tenorDays,
        uint256 aprBps,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 penaltyBps
    ) external onlyOwner returns (uint256) {
        if (aprBps == 0) revert InvalidApr();
        if (tenorDays == 0) revert InvalidTenor();

        planCount++;
        uint256 planId = planCount;

        plans[planId] = SavingPlan({
            tenorDays: tenorDays,
            aprBps: aprBps,
            minDeposit: minDeposit,
            maxDeposit: maxDeposit,
            penaltyBps: penaltyBps,
            enabled: false
        });

        emit PlanCreated(planId, tenorDays, aprBps, minDeposit, maxDeposit, penaltyBps);
        return planId;
    }

    /// @notice Update the APR of an existing plan
    /// @dev Only owner can call. Does not affect existing deposits (APR snapshotted at opening)
    /// @param planId ID of the plan to update
    /// @param newAprBps New APR in basis points (100 = 1%)
    function updatePlan(uint256 planId, uint256 newAprBps) external onlyOwner {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        if (newAprBps == 0) revert InvalidApr();

        plans[planId].aprBps = newAprBps;
        emit PlanUpdated(planId, newAprBps);
    }

    /// @notice Enable a plan for new deposits
    /// @dev Only owner can call
    /// @param planId ID of the plan to enable
    function enablePlan(uint256 planId) external onlyOwner {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        plans[planId].enabled = true;
        emit PlanEnabled(planId);
    }

    /// @notice Disable a plan from accepting new deposits
    /// @dev Only owner can call. Existing deposits remain unaffected
    /// @param planId ID of the plan to disable
    function disablePlan(uint256 planId) external onlyOwner {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        plans[planId].enabled = false;
        emit PlanDisabled(planId);
    }

    /// @notice Get details of a specific plan
    /// @param planId ID of the plan to query
    /// @return SavingPlan structure with plan details
    function getPlan(uint256 planId) external view returns (SavingPlan memory) {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        return plans[planId];
    }

    /// @notice Open a new term deposit
    /// @dev Mints an NFT certificate. APR and penalty are snapshotted at opening.
    /// @param planId ID of the plan to use
    /// @param amount Deposit amount (in underlying token decimals)
    /// @return depositId The ID of the newly created deposit
    function openDeposit(uint256 planId, uint256 amount) external whenNotPaused returns (uint256) {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        SavingPlan memory plan = plans[planId];
        if (!plan.enabled) revert PlanNotEnabled();
        if (amount < plan.minDeposit) revert DepositBelowMinimum();
        if (amount > plan.maxDeposit) revert DepositAboveMaximum();

        underlyingToken.transferFrom(msg.sender, address(this), amount);

        depositCount++;
        uint256 depositId = depositCount;

        deposits[depositId] = DepositInfo({
            owner: msg.sender,
            planId: planId,
            principal: amount,
            maturityAt: block.timestamp + (plan.tenorDays * 1 days),
            aprBpsAtOpen: plan.aprBps,
            penaltyBpsAtOpen: plan.penaltyBps,
            status: DepositStatus.Active
        });

        _mint(msg.sender, depositId);
        _setTokenURI(depositId, string(abi.encodePacked("term-deposit/", Strings.toString(depositId))));

        emit DepositOpened(depositId, msg.sender, planId, amount, deposits[depositId].maturityAt);
        return depositId;
    }

    /// @notice Withdraw a matured deposit
    /// @dev Burns the NFT. Pays principal + interest (from vault)
    /// @param depositId ID of the deposit to withdraw
    function withdraw(uint256 depositId) external whenNotPaused {
        DepositInfo memory deposit = deposits[depositId];
        if (deposit.owner == address(0)) revert PlanDoesNotExist();
        if (msg.sender != deposit.owner) revert NotDepositOwner();
        if (deposit.status != DepositStatus.Active) revert AlreadyWithdrawn();
        if (block.timestamp < deposit.maturityAt) revert DepositNotMatured();

        uint256 tenorSeconds = plans[deposit.planId].tenorDays * 1 days;
        uint256 interest = _calculateInterest(deposit.principal, deposit.aprBpsAtOpen, tenorSeconds);
        uint256 total = deposit.principal + interest;

        deposits[depositId].status = DepositStatus.Withdrawn;
        _burn(depositId);

        underlyingToken.transfer(msg.sender, deposit.principal);
        underlyingToken.transferFrom(address(vaultManager), msg.sender, interest);

        emit Withdrawn(depositId, deposit.owner, deposit.principal, interest, total);
    }

    /// @notice Withdraw a deposit before maturity (early withdrawal)
    /// @dev No interest paid. Penalty is deducted and sent to feeReceiver
    /// @param depositId ID of the deposit to withdraw early
    function earlyWithdraw(uint256 depositId) external whenNotPaused {
        DepositInfo memory deposit = deposits[depositId];
        if (deposit.owner == address(0)) revert PlanDoesNotExist();
        if (msg.sender != deposit.owner) revert NotDepositOwner();
        if (deposit.status != DepositStatus.Active) revert AlreadyWithdrawn();
        if (block.timestamp >= deposit.maturityAt) revert DepositNotMatured();

        uint256 penalty = (deposit.principal * deposit.penaltyBpsAtOpen) / BASIS_POINTS;
        uint256 received = deposit.principal - penalty;

        deposits[depositId].status = DepositStatus.Withdrawn;
        _burn(depositId);

        underlyingToken.transfer(msg.sender, received);
        underlyingToken.transfer(feeReceiver, penalty);

        emit EarlyWithdrawn(depositId, deposit.owner, deposit.principal, penalty, received);
    }

    /// @notice Manually renew a matured deposit with a new plan
    /// @dev Uses current market rate (new plan's APR). Marks old deposit as ManualRenewed
    /// @param depositId ID of the deposit to renew
    /// @param newPlanId ID of the plan to use for renewal
    /// @return newDepositId ID of the newly created deposit
    function renewDeposit(uint256 depositId, uint256 newPlanId) external whenNotPaused returns (uint256) {
        DepositInfo memory deposit = deposits[depositId];
        if (deposit.owner == address(0)) revert PlanDoesNotExist();
        if (msg.sender != deposit.owner) revert NotDepositOwner();
        if (deposit.status != DepositStatus.Active) revert AlreadyRenewed();
        if (block.timestamp < deposit.maturityAt) revert DepositNotMatured();
        if (newPlanId == 0 || newPlanId > planCount) revert PlanDoesNotExist();
        if (!plans[newPlanId].enabled) revert PlanNotEnabled();

        uint256 tenorSeconds = plans[deposit.planId].tenorDays * 1 days;
        uint256 interest = _calculateInterest(deposit.principal, deposit.aprBpsAtOpen, tenorSeconds);
        uint256 newPrincipal = deposit.principal + interest;

        deposits[depositId].status = DepositStatus.ManualRenewed;

        depositCount++;
        uint256 newDepositId = depositCount;
        SavingPlan memory newPlan = plans[newPlanId];

        deposits[newDepositId] = DepositInfo({
            owner: deposit.owner,
            planId: newPlanId,
            principal: newPrincipal,
            maturityAt: block.timestamp + (newPlan.tenorDays * 1 days),
            aprBpsAtOpen: newPlan.aprBps,
            penaltyBpsAtOpen: newPlan.penaltyBps,
            status: DepositStatus.Active
        });

        _mint(deposit.owner, newDepositId);
        _setTokenURI(newDepositId, string(abi.encodePacked("term-deposit/", Strings.toString(newDepositId))));

        emit Renewed(depositId, newDepositId, deposit.owner, newPrincipal, newPlanId);
        return newDepositId;
    }

    /// @notice Automatically renew a matured deposit after grace period
    /// @dev Anyone can call. Uses locked APR from original deposit. Marks old as AutoRenewed
    /// @param depositId ID of the deposit to auto-renew
    /// @return newDepositId ID of the newly created deposit
    function autoRenewDeposit(uint256 depositId) external whenNotPaused returns (uint256) {
        DepositInfo memory deposit = deposits[depositId];
        if (deposit.owner == address(0)) revert PlanDoesNotExist();
        if (deposit.status != DepositStatus.Active) revert AlreadyRenewed();
        if (block.timestamp < deposit.maturityAt + GRACE_PERIOD) revert GracePeriodNotOver();

        uint256 tenorSeconds = plans[deposit.planId].tenorDays * 1 days;
        uint256 interest = _calculateInterest(deposit.principal, deposit.aprBpsAtOpen, tenorSeconds);
        uint256 newPrincipal = deposit.principal + interest;

        deposits[depositId].status = DepositStatus.AutoRenewed;

        depositCount++;
        uint256 newDepositId = depositCount;
        uint256 originalPlanId = deposit.planId;
        SavingPlan memory originalPlan = plans[originalPlanId];

        deposits[newDepositId] = DepositInfo({
            owner: deposit.owner,
            planId: originalPlanId,
            principal: newPrincipal,
            maturityAt: block.timestamp + (originalPlan.tenorDays * 1 days),
            aprBpsAtOpen: deposit.aprBpsAtOpen,
            penaltyBpsAtOpen: deposit.penaltyBpsAtOpen,
            status: DepositStatus.Active
        });

        _mint(deposit.owner, newDepositId);
        _setTokenURI(newDepositId, string(abi.encodePacked("term-deposit/", Strings.toString(newDepositId))));

        emit Renewed(depositId, newDepositId, deposit.owner, newPrincipal, originalPlanId);
        return newDepositId;
    }

    /// @notice Update the fee receiver address
    /// @dev Only owner can call
    /// @param _feeReceiver New fee receiver address
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        if (_feeReceiver == address(0)) revert ZeroAddress();
        address oldReceiver = feeReceiver;
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(oldReceiver, _feeReceiver);
    }

    /// @notice Pause the contract
    /// @dev Only owner can call. Blocks deposit, withdraw, renew operations
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    /// @dev Only owner can call. Restores all functionality
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Check if the contract is paused
    /// @return True if the contract is paused
    function isPaused() external view returns (bool) {
        return paused();
    }

    /// @notice Get details of a specific deposit
    /// @param depositId ID of the deposit to query
    /// @return DepositInfo structure with deposit details
    function getDeposit(uint256 depositId) external view returns (DepositInfo memory) {
        if (depositId == 0 || depositId > depositCount) revert PlanDoesNotExist();
        return deposits[depositId];
    }
}
