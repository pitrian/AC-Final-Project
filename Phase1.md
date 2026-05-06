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
- [x] `npx hardhat compile` runs successfully
- [x] `npx hardhat test` runs successfully (4 tests passing)

### Day 2: Project Architecture Design

- [x] Designed contract inheritance hierarchy (see Architecture Diagram below)
- [x] Created interfaces:
  - `contracts/interfaces/IERC20.sol` - ERC20 token standard
  - `contracts/interfaces/IERC721.sol` - ERC721 NFT standard (Deposit Certificate)
  - `contracts/interfaces/IVaultManager.sol` - Vault management interface
  - `contracts/interfaces/ISavingCore.sol` - Saving core interface
- [x] Defined all custom errors and events (documented below)
- [x] Defined data structures (Structs, Enums in ISavingCore)
- [x] Architecture verification tests pass (4/4)

## Architecture Diagram

```
                    ┌─────────────────────────────────────────────────┐
                    │           OpenZeppelin Contracts                │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
                    │  │  ERC20   │  │  ERC721  │  │  Ownable     │  │
                    │  │          │  │          │  │  Pausable    │  │
                    │  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
                    └───────┼─────────────┼───────────────┼──────────┘
                            │             │               │
            ┌───────────────┼─────────────┼───────────────┼──────────┐
            │               │             │               │          │
            ▼               ▼             ▼               ▼          ▼
    ┌───────────────┐  ┌────────┐  ┌────────────┐  ┌─────────────┐  │
    │  MockUSDC     │  │ IERC20 │  │IVaultMgr   │  │ ISavingCore │  │
    │(tokens/)      │  │        │  │(interface) │  │ (interface) │  │
    │               │  │        │  └──────┬─────┘  └──────┬──────┘  │
    │ extends ERC20 │  └────────┘         │               │         │
    └───────────────┘                     │               │         │
                                          ▼               ▼         │
                              ┌─────────────────┐  ┌──────────────┐ │
                              │  VaultManager   │  │ SavingCore   │ │
                              │  (core/)        │  │ (core/)      │ │
                              │                 │  │              │ │
                              │ extends         │  │ extends      │ │
                              │ Ownable         │  │ Ownable      │ │
                              │ Pausable        │  │ Pausable     │ │
                              │                 │  │ ERC721       │ │
                              └─────────────────┘  └──────────────┘ │
                                                                    │
                    ┌───────────────────────────────────────────────┘
                    │
    SavingCore ─────┤ uses IVaultManager (for vault balance/withdraw)
                    │ uses IERC20 (for token transfers)
                    │ mints ERC721 (Deposit Certificate NFTs)
                    └───────────────────────────────────────────────┘
```

## Interfaces Summary

### IERC20 (`contracts/interfaces/IERC20.sol`)
Standard ERC20 interface for MockUSDC token.

### IERC721 (`contracts/interfaces/IERC721.sol`)
Standard ERC721 interface for Deposit Certificate NFTs.

### IVaultManager (`contracts/interfaces/IVaultManager.sol`)
Manages the protocol vault where interest payments are held.

| Function                        | Description                 | Access |
| ------------------------------- | --------------------------- | ------ |
| `fundVault(uint256 amount)`     | Add tokens to vault         | Anyone |
| `withdrawVault(uint256 amount)` | Withdraw from vault         | Owner  |
| `setFeeReceiver(address)`       | Update fee receiver address | Owner  |
| `pause()` / `unpause()`         | Toggle pause state          | Owner  |
| `getVaultBalance()`             | View vault balance          | Anyone |
| `getFeeReceiver()`              | View fee receiver           | Anyone |

### ISavingCore (`contracts/interfaces/ISavingCore.sol`)
Core saving logic: plans, deposits, NFTs, renewals.

| Function                         | Description                 | Access        |
| -------------------------------- | --------------------------- | ------------- |
| `createPlan(...)`                | Create a new saving plan    | Owner         |
| `updatePlan(uint256, uint256)`   | Update plan APR             | Owner         |
| `enablePlan(uint256)`            | Enable a plan               | Owner         |
| `disablePlan(uint256)`           | Disable a plan              | Owner         |
| `openDeposit(uint256, uint256)`  | Open deposit + mint NFT     | Anyone        |
| `withdraw(uint256)`              | Withdraw at maturity        | Deposit owner |
| `earlyWithdraw(uint256)`         | Early withdraw with penalty | Deposit owner |
| `renewDeposit(uint256, uint256)` | Manual renew                | Deposit owner |
| `autoRenewDeposit(uint256)`      | Auto renew after grace      | Anyone        |
| `pause()` / `unpause()`          | Toggle pause state          | Owner         |

## Events Defined

| Event                | Contract      | Parameters                                                                                                                     |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `VaultFunded`        | IVaultManager | `(address indexed funder, uint256 amount)`                                                                                     |
| `VaultWithdrawn`     | IVaultManager | `(address indexed to, uint256 amount)`                                                                                         |
| `FeeReceiverUpdated` | IVaultManager | `(address indexed oldReceiver, address indexed newReceiver)`                                                                   |
| `Paused`             | IVaultManager | `(address indexed account)`                                                                                                    |
| `Unpaused`           | IVaultManager | `(address indexed account)`                                                                                                    |
| `PlanCreated`        | ISavingCore   | `(uint256 indexed planId, uint256 tenorDays, uint256 aprBps, uint256 minDeposit, uint256 maxDeposit, uint256 penaltyBps)`      |
| `PlanUpdated`        | ISavingCore   | `(uint256 indexed planId, uint256 newAprBps)`                                                                                  |
| `PlanEnabled`        | ISavingCore   | `(uint256 indexed planId)`                                                                                                     |
| `PlanDisabled`       | ISavingCore   | `(uint256 indexed planId)`                                                                                                     |
| `DepositOpened`      | ISavingCore   | `(uint256 indexed depositId, address indexed owner, uint256 indexed planId, uint256 principal, uint256 maturityAt)`            |
| `Withdrawn`          | ISavingCore   | `(uint256 indexed depositId, address indexed owner, uint256 principal, uint256 interest, uint256 total)`                       |
| `EarlyWithdrawn`     | ISavingCore   | `(uint256 indexed depositId, address indexed owner, uint256 principal, uint256 penalty, uint256 received)`                     |
| `Renewed`            | ISavingCore   | `(uint256 indexed oldDepositId, uint256 indexed newDepositId, address indexed owner, uint256 newPrincipal, uint256 newPlanId)` |
| `SavingCorePaused`   | ISavingCore   | `(address indexed account)`                                                                                                    |
| `SavingCoreUnpaused` | ISavingCore   | `(address indexed account)`                                                                                                    |

## Custom Errors Defined

| Error                      | Contract      | When                                |
| -------------------------- | ------------- | ----------------------------------- |
| `NotOwner`                 | IVaultManager | Non-owner calls restricted function |
| `InsufficientVaultBalance` | IVaultManager | Withdraw exceeds vault balance      |
| `ZeroAddress`              | Both          | Address parameter is zero           |
| `VaultPaused`              | IVaultManager | Operation while vault is paused     |
| `PlanDoesNotExist`         | ISavingCore   | Referenced plan ID doesn't exist    |
| `PlanNotEnabled`           | ISavingCore   | Attempting deposit on disabled plan |
| `InvalidApr`               | ISavingCore   | APR is zero                         |
| `InvalidTenor`             | ISavingCore   | Tenor is zero                       |
| `DepositBelowMinimum`      | ISavingCore   | Amount < plan minDeposit            |
| `DepositAboveMaximum`      | ISavingCore   | Amount > plan maxDeposit            |
| `DepositNotMatured`        | ISavingCore   | Withdraw/renew before maturity      |
| `DepositAlreadyWithdrawn`  | ISavingCore   | Double withdraw attempt             |
| `DepositAlreadyRenewed`    | ISavingCore   | Double renew attempt                |
| `GracePeriodNotOver`       | ISavingCore   | Auto-renew before 3 day grace       |
| `NotDepositOwner`          | ISavingCore   | Non-owner tries withdraw/renew      |
| `InvalidPlanId`            | ISavingCore   | Plan ID is zero or invalid          |
| `CoreIsPaused`             | ISavingCore   | Operation while core is paused      |

## Data Structures

### Enums
```solidity
enum DepositStatus {
    Active,         // Deposit is active and can be withdrawn
    Withdrawn,      // Deposit was withdrawn at/after maturity
    ManualRenewed,  // Deposit was manually renewed
    AutoRenewed     // Deposit was auto-renewed after grace period
}
```

### Structs
```solidity
struct SavingPlan {
    uint256 tenorDays;      // Duration in days
    uint256 aprBps;         // Annual percentage rate (basis points, 10000 = 100%)
    uint256 minDeposit;     // Minimum deposit amount (6 decimals)
    uint256 maxDeposit;     // Maximum deposit amount (6 decimals)
    uint256 penaltyBps;     // Early withdrawal penalty (basis points)
    bool    enabled;        // Whether plan accepts new deposits
}

struct DepositInfo {
    address       owner;            // NFT owner / depositor
    uint256       planId;           // Reference to SavingPlan
    uint256       principal;        // Deposited amount (6 decimals)
    uint256       maturityAt;       // block.timestamp when deposit matures
    uint256       aprBpsAtOpen;     // APR snapshot at deposit time
    uint256       penaltyBpsAtOpen; // Penalty snapshot at deposit time
    DepositStatus status;           // Current deposit status
}
```

### Key Formulas
```
Interest = (principal * aprBps * tenorSeconds) / (31536000 * 10000)
Penalty = (principal * penaltyBps) / 10000
New Principal (renew) = oldPrincipal + interest
Grace Period = 3 days (259200 seconds)
```

## Project Structure
```
nft-term-deposit/
├── contracts/
│   ├── tokens/           # MockUSDC will go here (Phase 2)
│   ├── interfaces/
│   │   ├── IERC20.sol    ✓ Created
│   │   ├── IERC721.sol   ✓ Created
│   │   ├── IVaultManager.sol ✓ Created
│   │   └── ISavingCore.sol   ✓ Created
│   └── core/             # VaultManager, SavingCore (Phase 3-4)
├── test/
│   └── Architecture.test.ts ✓ Created (4 tests passing)
├── deploy/
│   └── 1-deploy.ts
├── scripts/
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .env
└── Phase1.md
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

## Dependency Issues Encountered & Resolved

### 1. JSON Syntax Error
**Issue:** Missing trailing comma in package.json scripts section.
**Fix:** Fixed the JSON syntax.

### 2. Dependency Conflicts
**Issue:** `@nomicfoundation/hardhat-toolbox@3.0.0` requires `@nomicfoundation/hardhat-verify@^1.0.0` but package had v2.x
**Fix:** Removed `hardhat-toolbox`, `ethereum-waffle`, `ethereumjs-abi`, `global`. Added `typechain@^8.3.2`. Used `yarn install`.

### 3. Private Keys in Config
**Issue:** Hardhat crashed when env vars were undefined.
**Fix:** Made network accounts conditional.

## Next Steps for Phase 2

Phase 2 will implement MockUSDC token:
1. Create `contracts/tokens/MockUSDC.sol` extending OpenZeppelin ERC20
2. Set decimals = 6 (USDC standard)
3. Add `mint(address to, uint256 amount)` function
4. Add `burn(uint256 amount)` function (optional)
5. Write unit tests: mint, transfer, approve, transferFrom, burn, edge cases

-----
*Phase 1 complete (Day 1 + Day 2) - Ready for Phase 2: MockUSDC Token*
