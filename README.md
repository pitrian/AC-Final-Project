# 📋 Master Plan: NFT-Powered Term Deposit Protocol

## 📊 Tổng quan dự án

| Thông tin           | Chi tiết                                                  |
| ------------------- | --------------------------------------------------------- |
| **Project Name**    | NFT-Powered Term Deposit Protocol                         |
| **Framework**       | Hardhat + ethers.js + TypeScript                          |
| **Token Standard**  | ERC20 (MockUSDC 6 decimals), ERC721 (Deposit Certificate) |
| **Coverage Target** | ≥90%                                                      |
| **Frontend**        | React + MetaMask                                          |

---

## 🗓️ Phases & Timeline

```
Tổng thời gian: 20 ngày (4 tuần)
├── Phase 1: Setup & Infrastructure     (2 ngày)
├── Phase 2: MockUSDC Token             (2 ngày)
├── Phase 3: VaultManager Contract     (3 ngày)
├── Phase 4: SavingCore Contract       (5 ngày)
├── Phase 5: Testing & Coverage         (4 ngày)
├── Phase 6: Frontend Demo              (3 ngày)
└── Phase 7: Integration & Polish       (1 ngày)
```
--
---

## 📅 Phase 1: Setup & Infrastructure

### Ngày 1: Environment Setup

**Mục tiêu:** Thiết lập môi trường development và cấu trúc project

**Tasks:**
- [x] Tạo thư mục `contracts/` theo cấu trúc module
- [x] Tạo thư mục `test/` cho test cases
- [x] Tạo thư mục `scripts/` cho deployment
- [x] Cấu hình Hardhat network (localhost, sepolia)
- [x] Cài đặt thêm dependencies cần thiết (nếu có)
- [x] Kiểm tra `hardhat compile` chạy thành công

**Definition of Done:**
- [x] `npx hardhat compile` không có lỗi
- [x] Cấu trúc thư mục rõ ràng, có thể import contracts được

---

### Ngày 2: Project Architecture Design

**Mục tiêu:** Thiết kế kiến trúc contracts và interface

**Tasks:**
- [x] Thiết kế contract inheritance hierarchy
- [x] Define interfaces (IERC20, IERC721)
- [x] Lập danh sách events cần emit
- [x] Xác định access control (Ownable, Roles)
- [x] Sketch data structures (Structs)

**Definition of Done:**
- [x] Architecture diagram (text-based) hoàn thành
- [x] Danh sách events & errors được document

---

## 📅 Phase 2: MockUSDC Token

### Ngày 3: MockUSDC Implementation

**Mục tiêu:** Implement ERC20 token với 6 decimals

**Tasks:**
- [x] Tạo `contracts/tokens/MockUSDC.sol`
- [x] Kế thừa ERC20 của OpenZeppelin
- [x] Set decimals = 6
- [x] Thêm function `mint(address to, uint256 amount)`
- [x] Thêm function `burn(uint256 amount)` (optional)
- [x] Viết unit tests cơ bản

**Definition of Done:**
- [x] Contract deploy được trên local network
- [x] Mint/Balance hoạt động đúng
- [x] Decimals trả về 6

---

### Ngày 4: MockUSDC Testing

**Mục tiêu:** Test đầy đủ MockUSDC functions

**Tasks:**
- [x] Test `mint()` - mint cho nhiều accounts
- [x] Test `transfer()` - chuyển token
- [x] Test `approve()` & `transferFrom()`
- [x] Test `burn()` (nếu có)
- [x] Test edge cases (overflow, zero address)

**Definition of Done:**
- [x] Tất cả basic tests pass
- [x] Coverage >80% cho MockUSDC

---

## 📅 Phase 3: VaultManager Contract

### Ngày 5: VaultManager Core Implementation

**Mục tiêu:** Implement VaultManager với core functions

**Tasks:**
- [x] Tạo `contracts/VaultManager.sol`
- [x] Import Ownable (OpenZeppelin)
- [x] Import Pausable (OpenZeppelin)
- [x] Khai báo state variables:
  - `underlyingToken` (address)
  - `vaultBalance` (uint256)
  - `feeReceiver` (address)
- [x] Implement `fundVault(uint256 amount)`
- [x] Implement `withdrawVault(uint256 amount)`

**Definition of Done:**
- [x] Contract compile thành công
- [x] Basic functions có thể gọi được

---

### Ngày 6: VaultManager Advanced Features

**Mục tiêu:** Thêm pause/unpause và access control

**Tasks:**
- [x] Implement `setFeeReceiver(address _feeReceiver)`
- [x] Implement `pause()` & `unpause()`
- [x] Thêm onlyOwner modifiers
- [x] Implement `getVaultBalance()`
- [x] Viết events: `VaultFunded`, `VaultWithdrawn`, `FeeReceiverUpdated`

**Definition of Done:**
- [x] Pause/Unpause hoạt động đúng
- [x] Access control được enforce
- [x] Events được emit đúng

---

### Ngày 7: VaultManager Testing

**Mục tiêu:** Test đầy đủ VaultManager

**Tasks:**
- [x] Test `fundVault()` - happy path
- [x] Test `withdrawVault()` - happy path
- [x] Test `withdrawVault()` - không đủ balance
- [x] Test `setFeeReceiver()`
- [x] Test `pause()` & `unpause()`
- [x] Test access control (onlyOwner)

**Definition of Done:**
- [x] Tất cả tests pass
- [x] Coverage >85% cho VaultManager

---

## 📅 Phase 4: SavingCore Contract

### Ngày 8: SavingCore - Structs & Data Structures

**Mục tiêu:** Thiết lập data structures và interfaces

**Tasks:**
- [x] Tạo `contracts/SavingCore.sol`
- [x] Define `SavingPlan` struct:
  - `tenorDays` (uint256)
  - `aprBps` (uint256)
  - `minDeposit` (uint256)
  - `maxDeposit` (uint256)
  - `penaltyBps` (uint256)
  - `enabled` (bool)
- [x] Define `DepositInfo` struct:
  - `owner` (address)
  - `planId` (uint256)
  - `principal` (uint256)
  - `maturityAt` (uint256)
  - `aprBpsAtOpen` (uint256)
  - `penaltyBpsAtOpen` (uint256)
  - `status` (enum)
- [x] Define Status enum: `Active`, `Withdrawn`, `ManualRenewed`, `AutoRenewed`
- [x] State variables: `plans`, `deposits`, `planCount`, `depositCount`

**Definition of Done:**
- [x] Structs được định nghĩa đầy đủ
- [x] Contract compile không lỗi

---

### Ngày 9: SavingCore - Plan Management

**Mục tiêu:** Implement admin functions cho plan management

**Tasks:**
- [x] Implement `createPlan(...)` - tạo gói tiết kiệm
- [x] Implement `updatePlan(uint256 planId, uint256 newAprBps)`
- [x] Implement `enablePlan(uint256 planId)`
- [x] Implement `disablePlan(uint256 planId)`
- [x] Implement `getPlan(uint256 planId)`
- [x] Viết events: `PlanCreated`, `PlanUpdated`

**Definition of Done:**
- [x] Admin có thể tạo/update/enable/disable plans
- [x] Validation: APR > 0, tenorDays > 0
- [x] Events emit đúng

---

### Ngày 10: SavingCore - Deposit Logic (P1)

**Mục tiêu:** Implement mở khoản gửi và NFT minting

**Tasks:**
- [x] Setup ERC721 (kế thừa hoặc compose)
- [x] Implement `openDeposit(uint256 planId, uint256 amount)`
- [x] Validate: plan exists, enabled, min/max deposit
- [x] Transfer token từ user vào contract
- [x] Mint NFT với metadata (snapshot APR, penalty)
- [x] Calculate `maturityAt = now + tenorDays`
- [x] Emit `DepositOpened` event

**Definition of Done:**
- [x] User có thể gửi tiền và nhận NFT
- [x] APR & Penalty được snapshot vào NFT
- [x] Validation hoạt động đúng

---

### Ngày 11: SavingCore - Withdraw Logic

**Mục tiêu:** Implement rút tiền (đúng hạn và sớm)

**Tasks:**
- [x] Implement interest calculation formula:
  ```
  Interest = (principal * aprBps * tenorSeconds) / (31536000 * 10000)
  ```
- [x] Implement `withdraw(uint256 depositId)` - đúng hạn
  - Tính interest
  - Burn NFT
  - Transfer (principal + interest) từ Vault
  - Emit `Withdrawn`
- [x] Implement early withdrawal logic:
  - Interest = 0
  - Penalty = (principal * penaltyBps) / 10000
  - User receives (principal - penalty)
  - Transfer penalty tới feeReceiver
- [x] Handle insufficient vault balance (revert)

**Definition of Done:**
- [x] Rút đúng hạn: principal + interest
- [x] Rút sớm: principal - penalty, không lãi
- [x] NFT bị burn sau withdraw

---

### Ngày 12: SavingCore - Renew Logic (P1)

**Mục tiêu:** Implement manual renew

**Tasks:**
- [x] Implement `renewDeposit(uint256 depositId, uint256 newPlanId)`
- [x] Validate: deposit exists, owner, not already withdrawn
- [x] Validate: now >= maturityAt (không được sớm)
- [x] Validate: newPlan exists & enabled
- [x] Tính interest từ NFT cũ
- [x] New principal = oldPrincipal + interest
- [x] Mint new NFT với APR mới (market rate)
- [x] Mark old NFT as `ManualRenewed`
- [x] Emit `Renewed` event

**Definition of Done:**
- [x] Manual renew hoạt động đúng
- [x] Principal tích lũy đúng (gốc + lãi)
- [x] Old NFT bị mark không thể withdraw lại

---

### Ngày 13: SavingCore - Auto Renew Logic

**Mục tiêu:** Implement auto-renew với grace period

**Tasks:**
- [x] Define grace period = 3 days
- [x] Implement `autoRenewDeposit(uint256 depositId)`
- [x] Validate: now >= maturityAt + 3 days (grace period)
- [x] Validate: deposit is `Active` (not already renewed)
- [x] Tính interest từ NFT cũ (với APR cũ - locked)
- [x] New principal = oldPrincipal + interest
- [x] Mint new NFT với APR cũ (snapshot - NOT market rate!)
- [x] Mark old NFT as `AutoRenewed`
- [x] Emit `Renewed` event
- [x] Note: Anyone có thể trigger auto-renew (bot/keeper)

**Definition of Done:**
- [x] Auto-renew chỉ hoạt động sau 3 ngày grace period
- [x] APR được lock (không dùng market rate)
- [x] Anyone có thể trigger (không cần owner)

---

### Ngày 14: SavingCore - Pausing & Integration

**Mục tiêu:** Thêm pause/unpause và kết nối VaultManager

**Tasks:**
- [x] Import Pausable vào SavingCore
- [x] Implement `pause()` & `unpause()` (onlyOwner)
- [x] When paused: block withdraw, renew (manual & auto)
- [x] Kết nối với VaultManager:
  - Deposit: chuyển token vào VaultManager (hoặc giữ trong contract)
  - Withdraw: gọi VaultManager để lấy lãi
  - Note: thiết kế tùy chọn - có thể giữ principal trong contract, lãi từ Vault
- [x] Review and fix any integration issues

**Definition of Done:**
- [x] Pause blocks all withdraw/renew operations
- [x] Vault integration hoạt động đúng
- [x] All events emit correctly

---

## 📅 Phase 5: Testing & Coverage

### Ngày 15: Comprehensive Test Suite - Plan & Deposit

**Mục tiêu:** Viết tests đầy đủ cho plan và deposit

**Test Cases - Plan Management:**
- [ ] `createPlan`: valid plan, invalid APR (0), disabled by default
- [ ] `updatePlan`: update APR affects new deposits only
- [ ] `enable/disablePlan`: disabled plan rejects deposits

**Test Cases - Open Deposit:**
- [ ] `openDeposit`: happy path, thành công
- [ ] `openDeposit`: below minDeposit - should revert
- [ ] `openDeposit`: above maxDeposit - should revert
- [ ] `openDeposit`: disabled plan - should revert
- [ ] `openDeposit`: NFT được mint đúng

**Definition of Done:**
- [ ] All test cases pass
- [ ] Clear error messages cho từng revert case

---

### Ngày 16: Comprehensive Test Suite - Withdraw & Renew

**Test Cases - Withdraw At Maturity:**
- [ ] `withdraw`: correct interest calculation
- [ ] `withdraw`: too early - should revert or apply early penalty
- [ ] `withdraw`: already withdrawn - should revert
- [ ] `withdraw`: insufficient vault - should revert

**Test Cases - Early Withdrawal:**
- [ ] `earlyWithdraw`: correct penalty calculation
- [ ] `earlyWithdraw`: interest = 0
- [ ] `earlyWithdraw`: penalty transferred to feeReceiver
- [ ] `earlyWithdraw`: NFT burned

**Test Cases - Manual Renew:**
- [ ] `renewDeposit`: correct new principal (principal + interest)
- [ ] `renewDeposit`: status update (old NFT marked)
- [ ] `renewDeposit`: new NFT có APR mới (market rate)
- [ ] `renewDeposit`: before maturity - should revert
- [ ] `renewDeposit`: wrong plan - should revert

**Definition of Done:**
- [ ] All withdraw/renew tests pass
- [ ] Math calculations chính xác

---

### Ngày 17: Comprehensive Test Suite - Auto Renew & Vault

**Test Cases - Auto Renew:**
- [ ] `autoRenewDeposit`: before grace period (3 days) - should revert
- [ ] `autoRenewDeposit`: after grace period - success
- [ ] `autoRenewDeposit`: APR locked (NOT market rate)
- [ ] `autoRenewDeposit`: anyone can trigger (not just owner)
- [ ] `autoRenewDeposit`: new principal = old + interest
- [ ] `autoRenewDeposit`: old NFT marked as AutoRenewed

**Test Cases - Vault:**
- [ ] `fundVault`: admin fund vault
- [ ] `withdrawVault`: admin withdraw (within safe limit)
- [ ] `withdrawVault`: insufficient vault for interest payout - revert

**Test Cases - Pause:**
- [ ] `pause`: withdraw blocked when paused
- [ ] `pause`: renew blocked when paused
- [ ] `unpause`: restore functionality

**Definition of Done:**
- [ ] All edge cases covered
- [ ] Integration tests pass

---

### Ngày 18: Coverage Analysis & Fixes

**Mục tiêu:** Đạt coverage >90% và fix bugs

**Tasks:**
- [ ] Chạy `npx hardhat coverage` hoặc tương đương
- [ ] Analyze uncovered lines
- [ ] Add missing test cases
- [ ] Fix logic bugs discovered
- [ ] Refactor tests nếu cần

**Definition of Done:**
- [ ] Coverage ≥90%
- [ ] All critical paths tested
- [ ] No high-severity bugs

---

## 📅 Phase 6: Frontend Demo

### Ngày 19: Frontend Setup & Integration

**Mục tiêu:** Thiết lập React frontend và kết nối contracts

**Tasks:**
- [ ] Tạo React project (Vite hoặc CRA)
- [ ] Install dependencies: ethers, wagmi (optional)
- [ ] Cấu hình MetaMask connection
- [ ] Create contract instances (use ethers.js)
- [ ] Create hooks: `useWallet`, `useContracts`
- [ ] Setup environment variables (.env)

**Definition of Done:**
- [ ] Frontend build thành công
- [ ] Kết nối MetaMask được
- [ ] Contract instances có thể gọi

---

### Ngày 20: Frontend Features Implementation

**Mục tiêu:** Implement đầy đủ features theo requirements

**Features:**
- [ ] **View Plans**: Hiển thị danh sách available plans
- [ ] **Open Deposit**: Form để gửi tiền (chọn plan, nhập amount)
- [ ] **View Deposits**: Hiển thị user's active deposits (từ NFT)
- [ ] **Withdraw**: Button để rút tiền (đúng hạn/sớm)
- [ ] **Renew**: Button để gia hạn (manual)

**UI Requirements:**
- [ ] Connect/Disconnect MetaMask button
- [ ] Display connected address
- [ ] Display USDC balance
- [ ] Show plan details (tenor, APR, min/max)
- [ ] Show deposit details (principal, maturity, APR)
- [ ] Action buttons (Deposit, Withdraw, Renew)
- [ ] Loading states và error handling

**Definition of Done:**
- [ ] Tất cả features hoạt động
- [ ] Giao diện usable
- [ ] Integration với contracts đúng

---

## 📅 Phase 7: Integration & Polish

### Ngày 21: Final Integration & Documentation

**Mục tiêu:** Hoàn thiện và clean up

**Tasks:**
- [ ] Full integration test (deploy all contracts, run through flow)
- [ ] Fix any remaining bugs
- [ ] Add NatSpec comments to contracts
- [ ] Update README với instructions
- [ ] Clean up unused code
- [ ] Final code review

**Definition of Done:**
- [ ] End-to-end flow hoạt động
- [ ] Code quality đạt yêu cầu
- [ ] Documentation complete

---

## 🔄 Feedback Loop Process

```
Sau mỗi ngày:
1. User review kết quả
2. User provide feedback (bugs, issues, changes)
3. Tôi update Master Plan dựa trên feedback
4. Adjust tasks cho ngày tiếp theo nếu cần
```

**Khi cập nhật Plan:**
- [ ] Đánh dấu task đã hoàn thành
- [ ] Ghi nhận bugs/issues từ feedback
- [ ] Thêm new tasks nếu cần
- [ ] Adjust timeline nếu cần

---

## ⚠️ Key Technical Notes

| Topic          | Note                                                  |
| -------------- | ----------------------------------------------------- |
| **Math**       | Luôn nhân trước, chia sau: `(a * b * c) / d`          |
| **Precision**  | 6 decimals - 1 USDC = 1,000,000 units                 |
| **Time**       | Dùng `block.timestamp`, tận dụng Hardhat time helpers |
| **Vault**      | Tách biệt vault (lãi) và principal                    |
| **Auto-Renew** | Check `now >= maturityAt + 3 days` trước khi cho phép |
| **Snapshot**   | APR & Penalty lock vào NFT khi mint                   |

---

## ✅ Definition of Done - Project Level

- [ ] Tất cả 3 contracts deploy được
- [ ] Coverage ≥90%
- [ ] Frontend demo hoạt động
- [ ] All critical test cases pass
- [ ] Không có critical bugs
- [ ] Documentation complete