// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IVaultManager.sol";

interface ISavingCore {
    // Events
    event PlanCreated(uint256 indexed planId, uint256 tenorDays, uint256 aprBps, uint256 minDeposit, uint256 maxDeposit, uint256 penaltyBps);
    event PlanUpdated(uint256 indexed planId, uint256 newAprBps);
    event PlanEnabled(uint256 indexed planId);
    event PlanDisabled(uint256 indexed planId);
    event DepositOpened(uint256 indexed depositId, address indexed owner, uint256 indexed planId, uint256 principal, uint256 maturityAt);
    event Withdrawn(uint256 indexed depositId, address indexed owner, uint256 principal, uint256 interest, uint256 total);
    event EarlyWithdrawn(uint256 indexed depositId, address indexed owner, uint256 principal, uint256 penalty, uint256 received);
    event Renewed(uint256 indexed oldDepositId, uint256 indexed newDepositId, address indexed owner, uint256 newPrincipal, uint256 newPlanId);
    event SavingCorePaused(address indexed account);
    event SavingCoreUnpaused(address indexed account);

    // Errors
    error PlanDoesNotExist();
    error PlanNotEnabled();
    error InvalidApr();
    error InvalidTenor();
    error DepositBelowMinimum();
    error DepositAboveMaximum();
    error DepositNotMatured();
    error DepositAlreadyWithdrawn();
    error DepositAlreadyRenewed();
    error GracePeriodNotOver();
    error NotDepositOwner();
    error InvalidPlanId();
    error InsufficientVaultBalance();
    error ZeroAddress();
    error CoreIsPaused();

    // Enums
    enum DepositStatus {
        Active,
        Withdrawn,
        ManualRenewed,
        AutoRenewed
    }

    // Structs
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

    // View functions
    function getPlan(uint256 planId) external view returns (SavingPlan memory);
    function getDeposit(uint256 depositId) external view returns (DepositInfo memory);
    function getPlanCount() external view returns (uint256);
    function getDepositCount() external view returns (uint256);

    // Admin functions
    function createPlan(uint256 tenorDays, uint256 aprBps, uint256 minDeposit, uint256 maxDeposit, uint256 penaltyBps) external returns (uint256);
    function updatePlan(uint256 planId, uint256 newAprBps) external;
    function enablePlan(uint256 planId) external;
    function disablePlan(uint256 planId) external;

    // User functions
    function openDeposit(uint256 planId, uint256 amount) external returns (uint256 depositId);
    function withdraw(uint256 depositId) external;
    function earlyWithdraw(uint256 depositId) external;
    function renewDeposit(uint256 depositId, uint256 newPlanId) external returns (uint256 newDepositId);
    function autoRenewDeposit(uint256 depositId) external returns (uint256 newDepositId);

    // Pause
    function pause() external;
    function unpause() external;
}
