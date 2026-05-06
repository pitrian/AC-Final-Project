<div align="center">

# NFT-POWERED TERM DEPOSIT PROTOCOL
### *Next-Gen Decentralized Savings Engine & NFT-Based Yield Protocol*

![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?style=for-the-badge&logo=solidity&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-2.25.0-FFF100?style=for-the-badge&logo=ethereum&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen?style=for-the-badge&logo=codecov)
![License](https://img.shields.io/badge/License-ISC-green?style=for-the-badge)
</div>
---

## 📋 Project Overview
**NFT-Powered Term Deposit Protocol** is a complete decentralized banking application that implements a term deposit (fixed deposit) system on the blockchain using NFT certificates.
| Information        | Details                                                        |
| ------------------ | -------------------------------------------------------------- |
| **Project Name**   | NFT-Powered Term Deposit Protocol                              |
| **Framework**      | Hardhat + ethers.js v6 + TypeScript                            |
| **Token Standard** | ERC20 (MockUSDC 6 decimals), ERC721 (Term Deposit Certificate) |
| **Coverage**       | 100% lines/statements, 84.46% branch                           |
| **Frontend**       | React 19 + Vite + TypeScript                                   |
| **Total Tests**    | 179 tests (passing)                                            |
| **Total Time**     | 7 Phases (21 days planned)                                     |
---
## 🔑 Key Innovations
| Feature                | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| **Vault Separation**   | Treasury (VaultManager) separated from core logic for enhanced security |
| **Auto-Compounding**   | Interest automatically compounds on manual/auto renewal                 |
| **NFT Certificates**   | ERC721 tokens represent deposit ownership with unique URI               |
| **Grace Period**       | 3-day grace period after maturity with auto-renewal option              |
| **100% Test Coverage** | 179 tests ensuring complete contract reliability                        |
| **Modern Frontend**    | React 19 with TypeScript, MetaMask integration                          |
---
## 📅 Project Progress
| Phase   | Name                   | Status     | Tests     | Coverage |
| ------- | ---------------------- | ---------- | --------- | -------- |
| Phase 1 | Setup & Infrastructure | ✅ Complete | -         | -        |
| Phase 2 | MockUSDC Token         | ✅ Complete | 39 tests  | 100%     |
| Phase 3 | VaultManager Contract  | ✅ Complete | 37 tests  | 100%     |
| Phase 4 | SavingCore Contract    | ✅ Complete | 99 tests  | 100%     |
| Phase 5 | Testing & Coverage     | ✅ Complete | 179 tests | 100%     |
| Phase 6 | Frontend Demo          | ✅ Complete | -         | -        |
| Phase 7 | Integration & Polish   | ✅ Complete | 179 tests | 100%     |
---
## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Connect    │  │ PlanList   │  │ Deposits   │   │
│  │ Wallet     │  │            │  │            │   │
│  └────────────┘  └────────────┘  └────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Deposit    │  │ useWallet  │  │ useContracts│   │
│  │ Form       │  │ Hook       │  │ Hook        │   │
│  └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓ ethers.js v6
┌─────────────────────────────────────────────────────────┐
│              Blockchain (Ethereum/EVM)                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │   MockUSDC │  │ VaultManager│  │ SavingCore │   │
│  │   (ERC20)  │  │            │  │  (ERC721)   │   │
│  └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────┘
```
---
## 📜 Smart Contracts
### Feature Comparison Table
| Feature              | MockUSDC                 | VaultManager       | SavingCore                                     |
| -------------------- | ------------------------ | ------------------ | ---------------------------------------------- |
| **Standard**         | ERC20                    | Ownable + Pausable | ERC721 + ERC721URIStorage                      |
| **Lines of Code**    | ~86                      | ~124               | ~507                                           |
| **Decimals**         | 6 (like real USDC)       | -                  | -                                              |
| **Token Type**       | Fungible                 | -                  | NFT Certificate                                |
| **Mint Function**    | ✅ `mint(to, amount)`     | -                  | ✅ via `openDeposit()`                          |
| **Burn Function**    | ✅ `burn()`, `burnFrom()` | -                  | ✅ via `withdraw()`                             |
| **Pause/Unpause**    | -                        | ✅                  | ✅                                              |
| **Create Plans**     | -                        | -                  | ✅ `createPlan()`                               |
| **Open Deposit**     | -                        | -                  | ✅ `openDeposit()`                              |
| **Withdraw**         | -                        | -                  | ✅ `withdraw()` (principal + interest)          |
| **Early Withdraw**   | -                        | -                  | ✅ `earlyWithdraw()` (penalty)                  |
| **Manual Renew**     | -                        | -                  | ✅ `renewDeposit()` (new plan APR)              |
| **Auto Renew**       | -                        | -                  | ✅ `autoRenewDeposit()` (old APR, after 3 days) |
| **Fund Vault**       | -                        | ✅ `fundVault()`    | -                                              |
| **Set Fee Receiver** | -                        | ✅                  | ✅                                              |
| **Coverage**         | 100%                     | 100%               | 100%                                           |
| **NatSpec**          | ✅ Full                   | ✅ Full             | ✅ Full                                         |
### Detailed Contract Info
#### 1. MockUSDC.sol (~86 lines)
- **Standard:** ERC20 (OpenZeppelin)
- **Decimals:** 6 (matches real USDC)
- **Features:**
  - `mint(to, amount)` - Mint tokens (onlyOwner)
  - `burn(amount)` - Burn tokens from caller
  - `burnFrom(account, amount)` - Burn tokens from account
  - `decimals()` returns 6
- **Custom Errors:** `MintToZeroAddress`, `MintZeroAmount`, `BurnFromZeroAddress`, `BurnZeroAmount`, `InsufficientBalance`
- **Events:** `Minted`, `Burned`
#### 2. VaultManager.sol (~124 lines)
- **Purpose:** Manages vault funds for paying interest
- **Inherits:** Ownable, Pausable
- **State Variables:** `underlyingToken`, `vaultBalance`, `feeReceiver`
- **Functions:**
  - `fundVault(amount)` - Add tokens to vault (anyone)
  - `withdrawVault(to, amount)` - Withdraw from vault (onlyOwner)
  - `approveSpender(spender, amount)` - Approve spender for interest payments
  - `setFeeReceiver(_feeReceiver)` - Update fee receiver
  - `pause()` / `unpause()` - Pause/unpause vault
  - `getVaultBalance()` - View vault balance
- **Custom Errors:** `ZeroAddress`, `InsufficientVaultBalance`, `VaultPaused`
#### 3. SavingCore.sol (~507 lines) - Core Contract
- **Standard:** ERC721 NFT (Term Deposit Certificate)
- **Inherits:** ERC721, ERC721URIStorage, Ownable, Pausable
- **Constants:**
  - `SECONDS_PER_YEAR = 31536000`
  - `BASIS_POINTS = 10000`
  - `GRACE_PERIOD = 3 days`
- **Key Structures:**
  - `SavingPlan` struct: tenorDays, aprBps, minDeposit, maxDeposit, penaltyBps, enabled
  - `DepositInfo` struct: owner, planId, principal, maturityAt, aprBpsAtOpen, penaltyBpsAtOpen, status
  - `DepositStatus` enum: Active, Withdrawn, ManualRenewed, AutoRenewed
- **Plan Management:**
  - `createPlan(tenorDays, aprBps, minDeposit, maxDeposit, penaltyBps)` - Create new plan
  - `updatePlan(planId, newAprBps)` - Update APR
  - `enablePlan(planId)` / `disablePlan(planId)` - Toggle plan availability
  - `getPlan(planId)` - View plan details
- **Deposit Operations:**
  - `openDeposit(planId, amount)` - Open deposit + mint NFT
  - `withdraw(depositId)` - Withdraw at maturity (principal + interest)
  - `earlyWithdraw(depositId)` - Early withdrawal with penalty, no interest
  - `renewDeposit(depositId, newPlanId)` - Manual renew (new plan APR)
  - `autoRenewDeposit(depositId)` - Auto renew after 3-day grace period (locked APR)
  - `getDeposit(depositId)` - View deposit details
- **Interest Formula:** `Interest = (principal * aprBps * durationSeconds) / (SECONDS_PER_YEAR * BASIS_POINTS)` (with rounding fix)
- **Admin Functions:** `setFeeReceiver()`, `pause()`, `unpause()`
---
## 🧪 Testing
### Test Coverage (✅ 100% Lines/Statements)
```
| File                | % Stmts    | % Branch   | % Funcs    | % Lines    |
| ------------------- | ---------- | ---------- | ---------- | ---------- |
| SavingCore.sol      | 100        | 82.69      | 100        | 100        |
| VaultManager.sol    | 100        | 96.15      | 100        | 100        |
| MockUSDC.sol        | 100        | 77.78      | 100        | 100        |
| ------------------- | ---------- | ---------- | ---------- | ---------- |
| All files           | 100        | 84.46      | 100        | 100        |
```
### Test Suites
| Contract     | Tests           | Details                                               |
| ------------ | --------------- | ----------------------------------------------------- |
| MockUSDC     | ✅ 39 tests      | Deployment, mint, transfer, approve, burn, edge cases |
| VaultManager | ✅ 37 tests      | fundVault, withdrawVault, pause, access control       |
| SavingCore   | ✅ 99 tests      | Plans, deposits, withdraws, renews, pause, ERC721     |
| **Total**    | **✅ 179 tests** | **All passing (27-31s)**                              |
---
## 💻 Frontend Features
### Tech Stack
- **Framework:** React 19 + TypeScript
- **Build tool:** Vite v8
- **Web3:** ethers.js v6
- **Wallet:** MetaMask
### Components
| Component       | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `ConnectWallet` | Connect/Disconnect MetaMask, displays address & balances       |
| `PlanList`      | Displays available plans (APR, tenor, min/max)                 |
| `DepositForm`   | Form to open new deposit (select plan, enter amount)           |
| `MyDeposits`    | Shows user's active deposits with withdraw/renew options       |
| `AdminPanel`    | Admin interface for plan management, minting USDC, time travel |
### Hooks
| Hook           | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| `useWallet`    | Manages MetaMask wallet connection state                |
| `useContracts` | Initializes contracts, provides all operation functions |
### Features Implemented
- ✅ View Plans (available savings plans)
- ✅ Open Deposit (deposit funds, mint NFT certificate)
- ✅ View Deposits (user's NFT deposits with details)
- ✅ Withdraw (withdraw on time, receive principal + interest)
- ✅ Early Withdraw (withdraw early, penalty applied, no interest)
- ✅ Manual Renew (select new plan with market rate)
- ✅ Auto Renew (after 3-day grace period, locked APR)
- ✅ Connect/Disconnect MetaMask
- ✅ Display ETH balance, USDC balance
- ✅ Loading states & error handling
- ✅ Time Travel for testing (1 day, 30 days, 90 days, 3 days grace)
---
## 📁 Project Structure
```
Blockchain-Banking-Project/
├── contracts/
│   ├── core/
│   │   ├── SavingCore.sol      # Main contract (507 lines, ERC721)
│   │   └── VaultManager.sol    # Vault for interest payments (124 lines)
│   ├── tokens/
│   │   └── MockUSDC.sol         # ERC20 token (86 lines, 6 decimals)
│   └── interfaces/
│       ├── ISavingCore.sol
│       ├── IVaultManager.sol
│       ├── IERC20.sol
│       └── IERC721.sol
├── test/
│   ├── MockUSDC.test.ts         # 39 tests
│   ├── VaultManager.test.ts     # 37 tests
│   ├── SavingCore.test.ts      # 99 tests
│   └── Architecture.test.ts    # 4 tests
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectWallet.tsx
│   │   │   ├── PlanList.tsx
│   │   │   ├── DepositForm.tsx
│   │   │   ├── MyDeposits.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── hooks/
│   │   │   ├── useWallet.ts
│   │   │   └── useContracts.ts
│   │   ├── contracts/
│   │   │   └── abis.ts        # Contract ABIs
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── deploy-local.ts         # Local deployment with setup
│   └── test.ts
├── deploy/                      # Hardhat deploy scripts
│   └── 1-deploy.ts
├── hardhat.config.ts           # Hardhat configuration
├── package.json                # Root dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```
---
## 🚀 Quick Start
### 1. Install Dependencies
```bash
npm install
cd frontend && npm install
```
### 2. Start Local Blockchain
```bash
npx hardhat node
```
### 3. Deploy Contracts
Open a new terminal:
```bash
npx hardhat run scripts/deploy-local.ts --network localhost
```
Copy the contract addresses to `frontend/.env`:
```env
VITE_SAVING_CORE_ADDRESS=<contract_address>
VITE_MOCK_USDC_ADDRESS=<contract_address>
VITE_VAULT_MANAGER_ADDRESS=<contract_address>
```
### 4. Run Frontend
```bash
cd frontend
npm run dev
```
Access: `http://localhost:5173`
### 5. Test Flow
1. Connect MetaMask (Localhost 8545)
2. Import account from Hardhat node (private key in terminal 1)
3. Mint USDC from Hardhat console:
   ```javascript
   await mockUSDC.mint("0xYourAddress", ethers.parseUnits("10000", 6))
   ```
4. Test the features:
   - View Plans → Select plan
   - Open Deposit → Enter amount → Submit
   - View My Deposits → View information
   - Wait until maturity → Withdraw
   - Or Early Withdraw (penalty applied)
   - Renew (select new plan)
   - Time Travel to test auto-renewal (3 days grace period)
### 6. Test Sepolia
```
VITE_SAVING_CORE_ADDRESS=0xD5eFf.......
VITE_MOCK_USDC_ADDRESS=0xef282......
VITE_VAULT_MANAGER_ADDRESS=0x6695.....
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia Testnet
```
---
## 🚀 Deployment
### Deployment Addresses
| Contract     | Localhost       | Sepolia        |
| ------------ | --------------- | -------------- |
| MockUSDC     | `Deploy output` | To be deployed |
| SavingCore   | `Deploy output` | To be deployed |
| VaultManager | `Deploy output` | To be deployed |
---
## 🛣️ Future Roadmap
- [ ] **Chainlink Keepers Integration** - Fully automated auto-renewal without user signature
- [ ] **Multi-token Support** - USDT, DAI, and other stablecoins
- [ ] **Analytics Dashboard** - Real-time TVL, interest rates, user statistics
- [ ] **Mobile App** - React Native mobile interface
- [ ] **Mainnet Deployment** - Ethereum, Polygon, BSC
---
## ✅ Definition of Done - Project Level
- [x] All 3 contracts deploy successfully
- [x] Coverage ≥90% (Achieved: 100% lines/statements)
- [x] Frontend demo fully functional
- [x] All 179 critical test cases pass
- [x] No critical bugs
- [x] Documentation complete (NatSpec + README + Phase reports)
---
## 📊 Key Metrics
| Metric                   | Value                |
| ------------------------ | -------------------- |
| **Total Contracts**      | 3                    |
| **Total Solidity Lines** | ~717 lines           |
| **Total Tests**          | 179 tests            |
| **Test Pass Rate**       | 100%                 |
| **Lines Coverage**       | 100%                 |
| **Statements Coverage**  | 100%                 |
| **Branch Coverage**      | 84.46%               |
| **Frontend Build Size**  | ~499 KB JS, 6 KB CSS |
| **Frontend Build Time**  | ~1.0s                |
---
## 🎯 Key Features Implemented
### Smart Contracts
- ✅ ERC20 token with 6 decimals (like real USDC)
- ✅ Vault manages interest payment fund
- ✅ NFT Term Deposit Certificate (ERC721)
- ✅ Multiple savings plans (tenor, APR, min/max)
- ✅ Open deposit + mint NFT
- ✅ Withdraw at maturity (principal + interest)
- ✅ Early withdrawal (penalty, no interest)
- ✅ Manual renew (new plan = market rate)
- ✅ Auto renew (old APR locked, after 3 days grace)
- ✅ Pause/Unpause functionality
- ✅ Access control (Ownable)
### Frontend
- ✅ MetaMask integration
- ✅ View available plans
- ✅ Open new deposit
- ✅ View user's deposits (from NFT)
- ✅ Withdraw (on time / early)
- ✅ Renew deposit (select new plan)
- ✅ Auto-renew after grace period
- ✅ Display balances (ETH, USDC)
- ✅ Loading states & error handling
- ✅ Professional UI with status bar
---
## 🏆 Project Complete!
**NFT-Powered Term Deposit Protocol** has completed all 7 phases:
1. ✅ Phase 1: Setup & Infrastructure
2. ✅ Phase 2: MockUSDC Token
3. ✅ Phase 3: VaultManager Contract
4. ✅ Phase 4: SavingCore Contract
5. ✅ Phase 5: Testing & Coverage (100%)
6. ✅ Phase 6: Frontend Demo
7. ✅ Phase 7: Integration & Polish
**Ready for:**
- Demo to clients/users
- Deployment to testnet (Sepolia, Goerli)
- Deployment to mainnet (Ethereum, Polygon, BSC, etc.)
- Integration with production frontend
---
## 📚 Documentation Files
| File                 | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `README.md`          | Master plan + Quick Start guide (this file) |
| `PROJECT_SUMMARY.md` | Full project overview with all details      |
| `Phase1.md`          | Setup & Infrastructure report               |
| `Phase2.md`          | MockUSDC Token report                       |
| `Phase3.md`          | VaultManager Contract report                |
| `Phase4.md`          | SavingCore Contract report                  |
| `Phase5.md`          | Testing & Coverage report                   |
| `Phase6.md`          | Frontend Demo report                        |
| `Phase7.md`          | Integration & Polish report                 |
---
## 📜 License & Contact

**License:** ISC

<div align="center">

### **Team: C-X Chain**

[![GitHub](https://img.shields.io/badge/GitHub-C--X_Chain-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/C-X-Chain)
[![Gmail](https://img.shields.io/badge/Gmail-ngominhchung@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:ngominhchung@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ngô_Minh_Chung-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/ngo-minh-chung)

**Project Status:** 
✅ **COMPLETE** - Ready for Demo and Deployment!


---

*Project completed successfully with 179 tests, 100% coverage, and full-featured React frontend!* 🎉</div>