import { task } from "hardhat/config";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-verify";
import "hardhat-contract-sizer";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";

dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

const {
  TESTNET_PRIVATE_KEY: testnetPrivateKey,
  MAINNET_PRIVATE_KEY: mainnetPrivateKey,
} = process.env;
const reportGas = process.env.REPORT_GAS;

module.exports = {
  networks: {
    "hardhat": {
      chainId: 31337,
    },
    "localhost": {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
     "sepolia": {
       url: process.env.ALCHEMY_SEPOLIA_URL || "https://eth-sepolia.g.alchemy.com/v2/o7K3LHjW01rjqTPDH5USU",
       chainId: 11155111,
       accounts: testnetPrivateKey ? [testnetPrivateKey] : [],
       timeout: 40000,
     },
     "ethereum": {
       url: process.env.ALCHEMY_MAINNET_URL || "",
       chainId: 1,
       accounts: mainnetPrivateKey ? [mainnetPrivateKey] : [],
       timeout: 60000,
     }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          viaIR: true,
          evmVersion: "cancun"
        },
      }
    ],
  },
  abiExporter: {
    path: "data/abi",
    runOnCompile: true,
    clear: true,
    flat: false,
    only: [],
    spacing: 4,
  },
  gasReporter: {
    enabled: reportGas == "1",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
  },
  etherscan: {
    apiKey: {
      "mainnet": "",
    }
  },
  sourcify: {
    enabled: false,
  },
  mocha: {
    timeout: 40000,
  },
  namedAccounts: {
    deployer: 0,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
};
