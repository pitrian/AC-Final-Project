# Phase 1: Setup & Infrastructure - Completion Report

## Completed Tasks

### Day 1: Environment Setup

- [x] Created project `nft-term-deposit/` based on `ac-hardhat-template/`
- [x] Created modular contract directory structure:
  - `contracts/tokens/` - For ERC20 tokens (MockUSDC)
  - `contracts/interfaces/` - For contract interfaces
  - `contracts/core/` - For core contracts (VaultManager, SavingCore)
- [x] Created `test/` directory with test template
- [x] Created `scripts/` and `deploy/` directories for deployment
- [x] Configured Hardhat networks:
  - `hardhat` - Local in-memory network (chainId: 31337)
  - `localhost` - Local node (http://127.0.0.1:8545, chainId: 31337)
  - `sepolia` - Testnet (RPC configured, private key via .env)
  - `ethereum` - Mainnet (RPC configured, private key via .env)
- [x] Resolved dependency conflicts and installed all dependencies
- [x] Created placeholder contract for compilation verification
- [x] `npx hardhat compile` runs successfully
- [x] `npx hardhat test` runs successfully (3 tests passing)

### Definition of Done - Verified

- [x] `npx hardhat compile` completes without errors
- [x] Directory structure is modular and ready for imports
- [x] All 3 tests pass
- [ ] 
minhchung@DESKTOP-IE9NH89:~/Blockchain-Banking-Project/nft-term-deposit$ npx hardhat compile
✖ Help us improve Hardhat with anonymous crash reports & basic usage data? (Y/n) · y
Nothing to compile
No need to generate any newer typings.
 ·------------------------|--------------------------------|--------------------------------·
 |  Solc version: 0.8.28  ·  Optimizer enabled: true       ·  Runs: 1000                    │
 ·························|································|·································
 |  Contract Name         ·  Deployed size (KiB) (change)  ·  Initcode size (KiB) (change)  │
 ·························|································|·································
 |  Placeholder           ·                 0.435 (0.000)  ·                 0.461 (0.000)  │
 ·------------------------|--------------------------------|--------------------------------·
## Dependency Issues Encountered & Resolved

### 1. JSON Syntax Error
**Issue:** Missing trailing comma in package.json scripts section.
**Fix:** Fixed the JSON syntax.

### 2. Dependency Conflicts
**Issue:** 
- `@nomicfoundation/hardhat-toolbox@3.0.0` requires `@nomicfoundation/hardhat-verify@^1.0.0` but package had v2.x
- `hardhat-deploy-ethers@0.4.2` requires `hardhat-deploy@^0.12.0` but package had v1.x
- `ethereum-waffle` is deprecated and conflicts with modern hardhat setup

**Fix:** 
- Removed `@nomicfoundation/hardhat-toolbox` (hardhat v2.25+ bundles its plugins individually)
- Removed deprecated packages: `ethereum-waffle`, `ethereumjs-abi`, `global`
- Added `typechain@^8.3.2` (required by `@typechain/hardhat`)
- Used `yarn install` instead of npm (npm was getting OOM killed)
- Used `--legacy-peer-deps` where needed

### 3. Missing Private Keys in Config
**Issue:** Hardhat crashed when `TESTNET_PRIVATE_KEY` and `MAINNET_PRIVATE_KEY` env vars were undefined.
**Fix:** Made network accounts conditional: `accounts: testnetPrivateKey ? [testnetPrivateKey] : []`

## Project Structure

```
nft-term-deposit/
├── contracts/
│   ├── tokens/        # MockUSDC will go here
│   ├── interfaces/    # IERC20, IERC721 interfaces
│   ├── core/          # VaultManager, SavingCore
│   └── Placeholder.sol
├── test/
│   └── Placeholder.test.ts
├── deploy/
│   └── 1-deploy.ts
├── scripts/
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .env
└── .env_example
```

## Available Scripts

| Command            | Description                |
| ------------------ | -------------------------- |
| `yarn compile`     | Compile Solidity contracts |
| `yarn test`        | Run test suite             |
| `yarn hardhat`     | Run hardhat CLI            |
| `yarn node`        | Start local Hardhat node   |
| `yarn clean`       | Clean build artifacts      |
| `yarn run:sepolia` | Deploy to Sepolia testnet  |
| `yarn coverage`    | Run test coverage          |

## Next Steps for Phase 2

Phase 2 will implement MockUSDC token:
1. Create `contracts/tokens/MockUSDC.sol`
2. Inherit from OpenZeppelin ERC20
3. Set decimals = 6 (USDC standard)
4. Add `mint()` and optional `burn()` functions
5. Write unit tests

---
*Phase 1 completed - Ready for Phase 2: MockUSDC Token*
