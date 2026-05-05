// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IVaultManager.sol";

contract SavingCore is ERC721, ERC721URIStorage, Ownable, Pausable {
    uint256 private constant SECONDS_PER_YEAR = 31536000;
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant GRACE_PERIOD = 3 days;

    IERC20 public immutable underlyingToken;
    IVaultManager public immutable vaultManager;
    address public feeReceiver;

    uint256 public planCount;
    uint256 public depositCount;

    mapping(uint256 => SavingPlan) public plans;
    mapping(uint256 => DepositInfo) public deposits;

    enum DepositStatus {
        Active,
        Withdrawn,
        ManualRenewed,
        AutoRenewed
    }

    struct SavingPlan {
        uint256 tenorDays;
        uint256 aprBps;
        uint256 minDeposit;
        uint256 maxDeposit;
        uint256 penaltyBps;
        bool enabled;
    }

    struct DepositInfo {
        address owner;
        uint256 planId;
        uint256 principal;
        uint256 maturityAt;
        uint256 aprBpsAtOpen;
        uint256 penaltyBpsAtOpen;
        DepositStatus status;
    }

    error ZeroAddress();
    error InvalidApr();
    error InvalidTenor();
    error PlanDoesNotExist();
    error PlanNotEnabled();
    error DepositBelowMinimum();
    error DepositAboveMaximum();
    error DepositNotMatured();
    error AlreadyWithdrawn();
    error AlreadyRenewed();
    error NotDepositOwner();
    error GracePeriodNotOver();
    error InsufficientVaultBalance();
    error CoreIsPaused();

    event PlanCreated(uint256 indexed planId, uint256 tenorDays, uint256 aprBps, uint256 minDeposit, uint256 maxDeposit, uint256 penaltyBps);
    event PlanUpdated(uint256 indexed planId, uint256 newAprBps);
    event PlanEnabled(uint256 indexed planId);
    event PlanDisabled(uint256 indexed planId);
    event DepositOpened(uint256 indexed depositId, address indexed owner, uint256 indexed planId, uint256 principal, uint256 maturityAt);
    event Withdrawn(uint256 indexed depositId, address indexed owner, uint256 principal, uint256 interest, uint256 total);
    event EarlyWithdrawn(uint256 indexed depositId, address indexed owner, uint256 principal, uint256 penalty, uint256 received);
    event Renewed(uint256 indexed oldDepositId, uint256 indexed newDepositId, address indexed owner, uint256 newPrincipal, uint256 newPlanId);
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);

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

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _calculateInterest(uint256 principal, uint256 aprBps, uint256 durationSeconds) internal pure returns (uint256) {
        return (principal * aprBps * durationSeconds) / (SECONDS_PER_YEAR * BASIS_POINTS);
    }

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

    function updatePlan(uint256 planId, uint256 newAprBps) external onlyOwner {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        if (newAprBps == 0) revert InvalidApr();

        plans[planId].aprBps = newAprBps;
        emit PlanUpdated(planId, newAprBps);
    }

    function enablePlan(uint256 planId) external onlyOwner {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        plans[planId].enabled = true;
        emit PlanEnabled(planId);
    }

    function disablePlan(uint256 planId) external onlyOwner {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        plans[planId].enabled = false;
        emit PlanDisabled(planId);
    }

    function getPlan(uint256 planId) external view returns (SavingPlan memory) {
        if (planId == 0 || planId > planCount) revert PlanDoesNotExist();
        return plans[planId];
    }

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

    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        if (_feeReceiver == address(0)) revert ZeroAddress();
        address oldReceiver = feeReceiver;
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(oldReceiver, _feeReceiver);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function isPaused() external view returns (bool) {
        return paused();
    }

    function getDeposit(uint256 depositId) external view returns (DepositInfo memory) {
        if (depositId == 0 || depositId > depositCount) revert PlanDoesNotExist();
        return deposits[depositId];
    }
}
