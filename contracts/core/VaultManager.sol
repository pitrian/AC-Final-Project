// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title VaultManager
/// @author NFT-Powered Term Deposit Protocol
/// @notice Manages vault funds for paying interest on term deposits
/// @dev Extends Ownable and Pausable for access control
contract VaultManager is Ownable, Pausable {
    /// @notice The underlying ERC20 token (e.g., MockUSDC)
    IERC20 public immutable underlyingToken;
    
    /// @notice Current balance of tokens in the vault
    uint256 public vaultBalance;
    
    /// @notice Address receiving early withdrawal penalties
    address public feeReceiver;

    /// @notice Thrown when attempting to set a zero address
    error ZeroAddress();
    
    /// @notice Thrown when vault has insufficient balance
    error InsufficientVaultBalance();
    
    /// @notice Thrown when attempting operation while vault is paused
    error VaultPaused();

    /// @notice Emitted when vault is funded
    /// @param funder Address that funded the vault
    /// @param amount Amount of tokens deposited
    event VaultFunded(address indexed funder, uint256 amount);
    
    /// @notice Emitted when vault funds are withdrawn
    /// @param to Address receiving the funds
    /// @param amount Amount of tokens withdrawn
    event VaultWithdrawn(address indexed to, uint256 amount);
    
    /// @notice Emitted when fee receiver is updated
    /// @param oldReceiver Previous fee receiver address
    /// @param newReceiver New fee receiver address
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);

    /// @notice Initialize the VaultManager contract
    /// @param _underlyingToken Address of the ERC20 token
    /// @param _feeReceiver Address that receives early withdrawal penalties
    constructor(address _underlyingToken, address _feeReceiver) Ownable(msg.sender) {
        if (_underlyingToken == address(0)) revert ZeroAddress();
        if (_feeReceiver == address(0)) revert ZeroAddress();

        underlyingToken = IERC20(_underlyingToken);
        feeReceiver = _feeReceiver;
    }

    /// @notice Fund the vault with tokens (for paying interest)
    /// @dev Transfers tokens from caller to vault. Can be called by anyone.
    /// @param amount Amount of tokens to deposit
    function fundVault(uint256 amount) external whenNotPaused {
        if (amount == 0) revert ZeroAddress();

        vaultBalance += amount;
        underlyingToken.transferFrom(msg.sender, address(this), amount);
        emit VaultFunded(msg.sender, amount);
    }

    /// @notice Withdraw tokens from the vault
    /// @dev Only owner can call. Cannot withdraw more than vaultBalance.
    /// @param to Address to receive the tokens
    /// @param amount Amount of tokens to withdraw
    function withdrawVault(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAddress();
        if (amount > vaultBalance) revert InsufficientVaultBalance();

        vaultBalance -= amount;
        underlyingToken.transfer(to, amount);
        emit VaultWithdrawn(to, amount);
    }

    /// @notice Approve a spender to spend vault tokens
    /// @dev Only owner can call. Used to approve SavingCore to pull interest.
    /// @param spender Address to approve
    /// @param amount Amount to approve
    function approveSpender(address spender, uint256 amount) external onlyOwner {
        underlyingToken.approve(spender, amount);
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

    /// @notice Pause the vault
    /// @dev Only owner can call. Blocks fundVault operations.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the vault
    /// @dev Only owner can call. Restores vault functionality.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Get the current vault balance
    /// @return Current balance of tokens in the vault
    function getVaultBalance() external view returns (uint256) {
        return vaultBalance;
    }

    /// @notice Check if the vault is paused
    /// @return True if the vault is paused
    function isPaused() external view returns (bool) {
        return paused();
    }
}
