// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Placeholder
 * @notice Placeholder contract for Phase 1 setup verification
 * @dev This will be replaced with actual protocol contracts in subsequent phases
 */
contract Placeholder {
    string public constant NAME = "NFT Term Deposit Protocol";
    uint256 public constant VERSION = 1;

    function getProtocolInfo() external pure returns (string memory name, uint256 version) {
        return (NAME, VERSION);
    }
}
