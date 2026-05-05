// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;

    error MintToZeroAddress();
    error MintZeroAmount();
    error BurnFromZeroAddress();
    error BurnZeroAmount();
    error InsufficientBalance();

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    constructor() ERC20("Mock USD Coin", "mUSDC") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert MintToZeroAddress();
        if (amount == 0) revert MintZeroAmount();

        _mint(to, amount);
        emit Minted(to, amount);
    }

    function burn(uint256 amount) external {
        if (msg.sender == address(0)) revert BurnFromZeroAddress();
        if (amount == 0) revert BurnZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();

        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        if (account == address(0)) revert BurnFromZeroAddress();
        if (amount == 0) revert BurnZeroAmount();
        if (balanceOf(account) < amount) revert InsufficientBalance();

        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        emit Burned(account, amount);
    }
}
