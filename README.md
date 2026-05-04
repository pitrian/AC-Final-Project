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
- [ ] Tạo thư mục `contracts/` theo cấu trúc module
- [ ] Tạo thư mục `test/` cho test cases
- [ ] Tạo thư mục `scripts/` cho deployment
- [ ] Cấu hình Hardhat network (localhost, sepolia)
- [ ] Cài đặt thêm dependencies cần thiết (nếu có)
- [ ] Kiểm tra `hardhat compile` chạy thành công

**Definition of Done:**
- [ ] `npx hardhat compile` không có lỗi
- [ ] Cấu trúc thư mục rõ ràng, có thể import contracts được

---

### Ngày 2: Project Architecture Design

**Mục tiêu:** Thiết kế kiến trúc contracts và interface

**Tasks:**
- [ ] Thiết kế contract inheritance hierarchy
- [ ] Define interfaces (IERC20, IERC721)
- [ ] Lập danh sách events cần emit
- [ ] Xác định access control (Ownable, Roles)
- [ ] Sketch data structures (Structs)

**Definition of Done:**
- [ ] Architecture diagram (text-based) hoàn thành
- [ ] Danh sách events & errors được document

---

## 📅 Phase 2: MockUSDC Token

### Ngày 3: MockUSDC Implementation

**Mục tiêu:** Implement ERC20 token với 6 decimals

**Tasks:**
- [ ] Tạo `contracts/tokens/MockUSDC.sol`
- [ ] Kế thừa ERC20 của OpenZeppelin
- [ ] Set decimals = 6
- [ ] Thêm function `mint(address to, uint256 amount)`
- [ ] Thêm function `burn(uint256 amount)` (optional)
- [ ] Viết unit tests cơ bản

**Definition of Done:**
- [ ] Contract deploy được trên local network
- [ ] Mint/Balance hoạt động đúng
- [ ] Decimals trả về 6

---

### Ngày 4: MockUSDC Testing

**Mục tiêu:** Test đầy đủ MockUSDC functions

**Tasks:**
- [ ] Test `mint()` - mint cho nhiều accounts
- [ ] Test `transfer()` - chuyển token
- [ ] Test `approve()` & `transferFrom()`
- [ ] Test `burn()` (nếu có)
- [ ] Test edge cases (overflow, zero address)

**Definition of Done:**
- [ ] Tất cả basic tests pass
- [ ] Coverage >80% cho MockUSDC

---

## 📅 Phase 3: VaultManager Contract

### Ngày 5: VaultManager Core Implementation

**Mục tiêu:** Implement VaultManager với core functions

**Tasks:**
- [ ] Tạo `contracts/VaultManager.sol`
- [ ] Import Ownable (OpenZeppelin)
- [ ] Import Pausable (OpenZeppelin)
- [ ] Khai báo state variables:
  - `underlyingToken` (address)
  - `vaultBalance` (uint256)
  - `feeReceiver` (address)
- [ ] Implement `fundVault(uint256 amount)`
- [ ] Implement `withdrawVault(uint256 amount)`

**Definition of Done:**
- [ ] Contract compile thành công
- [ ] Basic functions có thể gọi được

---

### Ngày 6: VaultManager Advanced Features

**Mục tiêu:** Thêm pause/unpause và access control

**Tasks:**
- [ ] Implement `setFeeReceiver(address _feeReceiver)`
- [ ] Implement `pause()` & `unpause()`
- [ ] Thêm onlyOwner modifiers
- [ ] Implement `getVaultBalance()`
- [ ] Viết events: `VaultFunded`, `VaultWithdrawn`, `FeeReceiverUpdated`

**Definition of Done:**
- [ ] Pause/Unpause hoạt động đúng
- [ ] Access control được enforce
- [ ] Events được emit đúng

---

### Ngày 7: VaultManager Testing

**Mục tiêu:** Test đầy đủ VaultManager

**Tasks:**
- [ ] Test `fundVault()` - happy path
- [ ] Test `withdrawVault()` - happy path
- [ ] Test `withdrawVault()` - không đủ balance
- [ ] Test `setFeeReceiver()`
- [ ] Test `pause()` & `unpause()`
- [ ] Test access control (onlyOwner)

**Definition of Done:**
- [ ] Tất cả tests pass
- [ ] Coverage >85% cho VaultManager

---

## 📅 Phase 4: SavingCore Contract

### Ngày 8: SavingCore - Structs & Data Structures

**Mục tiêu:** Thiết lập data structures và interfaces

**Tasks:**
- [ ] Tạo `contracts/SavingCore.sol`
- [ ] Define `SavingPlan` struct:
  - `tenorDays` (uint256)
  - `aprBps` (uint256)
  - `minDeposit` (uint256)
  - `maxDeposit` (uint256)
  - `penaltyBps` (uint256)
  - `enabled` (bool)
- [ ] Define `DepositInfo` struct:
  - `owner` (address)
  - `planId` (uint256)
  - `principal` (uint256)
  - `maturityAt` (uint256)
  - `aprBpsAtOpen` (uint256)
  - `penaltyBpsAtOpen` (uint256)
  - `status` (enum)
- [ ] Define Status enum: `Active`, `Withdrawn`, `ManualRenewed`, `AutoRenewed`
- [ ] State variables: `plans`, `deposits`, `planCount`, `depositCount`

**Definition of Done:**
- [ ] Structs được định nghĩa đầy đủ
- [ ] Contract compile không lỗi

---

### Ngày 9: SavingCore - Plan Management

**Mục tiêu:** Implement admin functions cho plan management

**Tasks:**
- [ ] Implement `createPlan(...)` - tạo gói tiết kiệm
- [ ] Implement `updatePlan(uint256 planId, uint256 newAprBps)`
- [ ] Implement `enablePlan(uint256 planId)`
- [ ] Implement `disablePlan(uint256 planId)`
- [ ] Implement `getPlan(uint256 planId)`
- [ ] Viết events: `PlanCreated`, `PlanUpdated`

**Definition of Done:**
- [ ] Admin có thể tạo/update/enable/disable plans
- [ ] Validation: APR > 0, tenorDays > 0
- [ ] Events emit đúng

---

### Ngày 10: SavingCore - Deposit Logic (P1)

**Mục tiêu:** Implement mở khoản gửi và NFT minting

**Tasks:**
- [ ] Setup ERC721 (kế thừa hoặc compose)
- [ ] Implement `openDeposit(uint256 planId, uint256 amount)`
- [ ] Validate: plan exists, enabled, min/max deposit
- [ ] Transfer token từ user vào contract
- [ ] Mint NFT với metadata (snapshot APR, penalty)
- [ ] Calculate `maturityAt = now + tenorDays`
- [ ] Emit `DepositOpened` event

**Definition of Done:**
- [ ] User có thể gửi tiền và nhận NFT
- [ ] APR & Penalty được snapshot vào NFT
- [ ] Validation hoạt động đúng

---

### Ngày 11: SavingCore - Withdraw Logic

**Mục tiêu:** Implement rút tiền (đúng hạn và sớm)

**Tasks:**
- [ ] Implement interest calculation formula:
  ```
  Interest = (principal * aprBps * tenorSeconds) / (31536000 * 10000)
  ```
- [ ] Implement `withdraw(uint256 depositId)` - đúng hạn
  - Tính interest
  - Burn NFT
  - Transfer (principal + interest) từ Vault
  - Emit `Withdrawn`
- [ ] Implement early withdrawal logic:
  - Interest = 0
  - Penalty = (principal * penaltyBps) / 10000
  - User receives (principal - penalty)
  - Transfer penalty tới feeReceiver
- [ ] Handle insufficient vault balance (revert)

**Definition of Done:**
- [ ] Rút đúng hạn: principal + interest
- [ ] Rút sớm: principal - penalty, không lãi
- [ ] NFT bị burn sau withdraw

---

### Ngày 12: SavingCore - Renew Logic (P1)

**Mục tiêu:** Implement manual renew

**Tasks:**
- [ ] Implement `renewDeposit(uint256 depositId, uint256 newPlanId)`
- [ ] Validate: deposit exists, owner, not already withdrawn
- [ ] Validate: now >= maturityAt (không được sớm)
- [ ] Validate: newPlan exists & enabled
- [ ] Tính interest từ NFT cũ
- [ ] New principal = oldPrincipal + interest
- [ ] Mint new NFT với APR mới (market rate)
- [ ] Mark old NFT as `ManualRenewed`
- [ ] Emit `Renewed` event

**Definition of Done:**
- [ ] Manual renew hoạt động đúng
- [ ] Principal tích lũy đúng (gốc + lãi)
- [ ] Old NFT bị mark không thể withdraw lại

---

### Ngày 13: SavingCore - Auto Renew Logic

**Mục tiêu:** Implement auto-renew với grace period

**Tasks:**
- [ ] Define grace period = 3 days
- [ ] Implement `autoRenewDeposit(uint256 depositId)`
- [ ] Validate: now >= maturityAt + 3 days (grace period)
- [ ] Validate: deposit is `Active` (not already renewed)
- [ ] Tính interest từ NFT cũ (với APR cũ - locked)
- [ ] New principal = oldPrincipal + interest
- [ ] Mint new NFT với APR cũ (snapshot - NOT market rate!)
- [ ] Mark old NFT as `AutoRenewed`
- [ ] Emit `Renewed` event
- [ ] Note: Anyone có thể trigger auto-renew (bot/keeper)

**Definition of Done:**
- [ ] Auto-renew chỉ hoạt động sau 3 ngày grace period
- [ ] APR được lock (không dùng market rate)
- [ ] Anyone có thể trigger (không cần owner)

---

### Ngày 14: SavingCore - Pausing & Integration

**Mục tiêu:** Thêm pause/unpause và kết nối VaultManager

**Tasks:**
- [ ] Import Pausable vào SavingCore
- [ ] Implement `pause()` & `unpause()` (onlyOwner)
- [ ] When paused: block withdraw, renew (manual & auto)
- [ ] Kết nối với VaultManager:
  - Deposit: chuyển token vào VaultManager (hoặc giữ trong contract)
  - Withdraw: gọi VaultManager để lấy lãi
  - Note: thiết kế tùy chọn - có thể giữ principal trong contract, lãi từ Vault
- [ ] Review and fix any integration issues

**Definition of Done:**
- [ ] Pause blocks all withdraw/renew operations
- [ ] Vault integration hoạt động đúng
- [ ] All events emit correctly

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