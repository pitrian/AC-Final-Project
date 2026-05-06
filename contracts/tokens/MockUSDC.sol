// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDC
/// @author NFT-Powered Term Deposit Protocol
/// @notice Mock ERC20 token simulating USDC with 6 decimals
/// @dev Used for testing purposes. Inherits ERC20 and Ownable.
contract MockUSDC is ERC20, Ownable {
    /// @notice Number of decimals (6, matching real USDC)
    uint8 private constant _DECIMALS = 6;

    /// @notice Thrown when attempting to mint to zero address
    error MintToZeroAddress();
    
    /// @notice Thrown when attempting to mint zero amount
    error MintZeroAmount();
    
    /// @notice Thrown when attempting to burn from zero address
    error BurnFromZeroAddress();
    
    /// @notice Thrown when attempting to burn zero amount
    error BurnZeroAmount();
    
    /// @notice Thrown when attempting to burn more than balance
    error InsufficientBalance();

    /// @notice Emitted when tokens are minted
    /// @param to Address receiving the minted tokens
    /// @param amount Amount of tokens minted
    event Minted(address indexed to, uint256 amount);
    
    /// @notice Emitted when tokens are burned
    /// @param from Address from which tokens are burned
    /// @param amount Amount of tokens burned
    event Burned(address indexed from, uint256 amount);

    /// @notice Initialize the MockUSDC contract
    /// @dev Sets name "Mock USD Coin" and symbol "mUSDC"
    constructor() ERC20("Mock USD Coin", "mUSDC") Ownable(msg.sender) {}

    /// @notice Returns the number of decimals (6)
    /// @return Number of decimals (always 6)
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @notice Mint new tokens
    /// @dev Only owner can call
    /// @param to Address to receive the minted tokens
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert MintToZeroAddress();
        if (amount == 0) revert MintZeroAmount();

        _mint(to, amount);
        emit Minted(to, amount);
    }

    /// @notice Burn tokens from caller's balance
    /// @param amount Amount of tokens to burn
    function burn(uint256 amount) external {
        if (msg.sender == address(0)) revert BurnFromZeroAddress();
        if (amount == 0) revert BurnZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();

        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /// @notice Burn tokens from a specified account
    /// @dev Uses allowance mechanism
    /// @param account Address to burn tokens from
    /// @param amount Amount of tokens to burn
    function burnFrom(address account, uint256 amount) external {
        if (account == address(0)) revert BurnFromZeroAddress();
        if (amount == 0) revert BurnZeroAmount();
        if (balanceOf(account) < amount) revert InsufficientBalance();

        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        emit Burned(account, amount);
    }
}
