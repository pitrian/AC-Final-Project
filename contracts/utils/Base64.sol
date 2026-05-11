/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Base64
/// @notice Solidity library for Base64 encoding
library Base64 {
    string internal constant _ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /// @notice Encodes bytes to a base64 encoded string
    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        uint256 chars = (data.length + 2) / 3 * 4;
        bytes memory result = new bytes(chars);
        
        uint256 i = 0;
        uint256 j = 0;
        
        while (i < data.length) {
            uint256 b1 = uint8(data[i]);
            uint256 b2 = i + 1 < data.length ? uint8(data[i + 1]) : 0;
            uint256 b3 = i + 2 < data.length ? uint8(data[i + 2]) : 0;
            
            uint256 idx1 = b1 >> 2;
            uint256 idx2 = ((b1 & 0x03) << 4) | (b2 >> 4);
            uint256 idx3 = ((b2 & 0x0F) << 2) | (b3 >> 6);
            uint256 idx4 = b3 & 0x3F;
            
            result[j] = bytes(_ALPHABET)[idx1];
            result[j + 1] = bytes(_ALPHABET)[idx2];
            result[j + 2] = i + 1 < data.length ? bytes(_ALPHABET)[idx3] : bytes1("=");
            result[j + 3] = i + 2 < data.length ? bytes(_ALPHABET)[idx4] : bytes1("=");
            
            i += 3;
            j += 4;
        }
        
        return string(result);
    }
}