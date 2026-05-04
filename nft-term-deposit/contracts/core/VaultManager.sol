// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract VaultManager is Ownable, Pausable {
    IERC20 public immutable underlyingToken;
    uint256 public vaultBalance;
    address public feeReceiver;

    error ZeroAddress();
    error InsufficientVaultBalance();
    error VaultPaused();

    event VaultFunded(address indexed funder, uint256 amount);
    event VaultWithdrawn(address indexed to, uint256 amount);
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);

    constructor(address _underlyingToken, address _feeReceiver) Ownable(msg.sender) {
        if (_underlyingToken == address(0)) revert ZeroAddress();
        if (_feeReceiver == address(0)) revert ZeroAddress();

        underlyingToken = IERC20(_underlyingToken);
        feeReceiver = _feeReceiver;
    }

    function fundVault(uint256 amount) external whenNotPaused {
        if (amount == 0) revert ZeroAddress();

        vaultBalance += amount;
        underlyingToken.transferFrom(msg.sender, address(this), amount);
        emit VaultFunded(msg.sender, amount);
    }

    function withdrawVault(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAddress();
        if (amount > vaultBalance) revert InsufficientVaultBalance();

        vaultBalance -= amount;
        underlyingToken.transfer(to, amount);
        emit VaultWithdrawn(to, amount);
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

    function getVaultBalance() external view returns (uint256) {
        return vaultBalance;
    }

    function isPaused() external view returns (bool) {
        return paused();
    }
}
