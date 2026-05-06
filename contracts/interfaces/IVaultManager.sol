// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVaultManager {
    event VaultFunded(address indexed funder, uint256 amount);
    event VaultWithdrawn(address indexed to, uint256 amount);
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    error NotOwner();
    error InsufficientVaultBalance();
    error ZeroAddress();
    error VaultPaused();

    function underlyingToken() external view returns (IERC20);
    function getVaultBalance() external view returns (uint256);
    function getFeeReceiver() external view returns (address);
    function isPaused() external view returns (bool);

    function fundVault(uint256 amount) external;
    function withdrawVault(uint256 amount) external;
    function setFeeReceiver(address _feeReceiver) external;
    function pause() external;
    function unpause() external;
}
