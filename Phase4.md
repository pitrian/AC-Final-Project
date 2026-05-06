# Phase 4: SavingCore Contract - Completion Report

## Overview

SavingCore is the **heart and brain** of the entire protocol. It manages:
- Savings plans creation and configuration
- Deposit opening with ERC721 NFT minting (Deposit Certificates)
- Withdrawal logic (at maturity + early withdrawal with penalty)
- Interest calculation
- Manual renewal (compounding with new market rate)
- Auto-renewal (3-day grace period, locked APR)
- Emergency pause functionality

## Completed Tasks

### Day 8: Structs & Data Structures
- [x] Created `contracts/core/SavingCore.sol`
- [x] Defined `SavingPlan` struct (tenorDays, aprBps, min/maxDeposit, penaltyBps, enabled)
- [x] Defined `DepositInfo` struct (owner, planId, principal, maturityAt, APR/penalty snapshots, status)
- [x] Defined `DepositStatus` enum (Active, Withdrawn, ManualRenewed, AutoRenewed)
- [x] State variables: `plans`, `deposits`, `planCount`, `depositCount`
- [x] Contract compiles successfully (10.745 KiB deployed)

### Day 9: Plan Management
- [x] `createPlan(...)` - creates plan (disabled by default), returns planId
- [x] `updatePlan(planId, newAprBps)` - updates APR only
- [x] `enablePlan(planId)` / `disablePlan(planId)` - toggle plan availability
- [x] `getPlan(planId)` - view function for plan details
- [x] Validation: APR > 0, tenorDays > 0, planId must exist

### Day 10: Deposit Logic + NFT Minting
- [x] Inherits ERC721 + ERC721URIStorage from OpenZeppelin
- [x] NFT name: "Term Deposit Certificate", symbol: "TDC"
- [x] `openDeposit(planId, amount)` - validates plan, transfers tokens, mints NFT
- [x] Validates: plan exists, enabled, min/max deposit amount
- [x] Snapshots APR and penalty at deposit time into NFT
- [x] Calculates `maturityAt = block.timestamp + tenorDays * 1 days`
- [x] TokenURI format: `term-deposit/{depositId}`

### Day 11: Withdraw Logic
- [x] Interest formula: `(principal * aprBps * tenorSeconds) / (31536000 * 10000)`
- [x] `withdraw(depositId)` - at maturity: principal (from SavingCore) + interest (from VaultManager)
- [x] Burns NFT after withdrawal
- [x] `earlyWithdraw(depositId)` - before maturity: (principal - penalty) to user, penalty to feeReceiver
- [x] Burns NFT after early withdrawal
- [x] No interest on early withdrawal

### Day 12: Manual Renew
- [x] `renewDeposit(depositId, newPlanId)` - renews into any enabled plan
- [x] Validates: owner, Active status, >= maturityAt, newPlan exists & enabled
- [x] Interest = (principal * locked_apr * tenor) / year
- [x] New principal = old principal + interest (compounding!)
- [x] New NFT minted with NEW plan's APR (market rate)
- [x] Old deposit marked as `ManualRenewed` (not burned - still viewable)

### Day 13: Auto Renew
- [x] `autoRenewDeposit(depositId)` - anyone can trigger (bot/keeper)
- [x] Grace period: 3 days after maturityAt
- [x] Uses LOCKED APR (original deposit's APR, NOT current market rate)
- [x] New principal = old principal + interest (compounding!)
- [x] New NFT minted with LOCKED APR and LOCKED penalty
- [x] Same plan ID for new deposit
- [x] Old deposit marked as `AutoRenewed`

### Day 14: Pausing & VaultManager Integration
- [x] Inherits Pausable from OpenZeppelin
- [x] `pause()` / `unpause()` - owner only
- [x] When paused: blocks openDeposit, withdraw, earlyWithdraw, renewDeposit, autoRenewDeposit
- [x] VaultManager integration:
  - openDeposit: tokens go to SavingCore
  - withdraw: principal from SavingCore + interest from VaultManager (via transferFrom)
  - earlyWithdraw: tokens from SavingCore directly
- [x] VaultManager.approveSpender() allows SavingCore to pull interest payments

## Custom Errors (14 total)

| Error | When |
|-------|------|
| `ZeroAddress` | Zero address in constructor or setFeeReceiver |
| `InvalidApr` | APR = 0 on plan creation/update |
| `InvalidTenor` | Tenor = 0 on plan creation |
| `PlanDoesNotExist` | Invalid planId (0 or > planCount) |
| `PlanNotEnabled` | Plan is disabled |
| `DepositBelowMinimum` | Amount < plan.minDeposit |
| `DepositAboveMaximum` | Amount > plan.maxDeposit |
| `DepositNotMatured` | Withdraw/renew before maturityAt |
| `AlreadyWithdrawn` | Deposit already withdrawn |
| `AlreadyRenewed` | Deposit already renewed/withdrawn |
| `NotDepositOwner` | msg.sender != deposit.owner |
| `GracePeriodNotOver` | Auto-renew before 3-day grace period |
| `InsufficientVaultBalance` | (defined, used by VaultManager) |
| `CoreIsPaused` | (defined, but OpenZeppelin's EnforcedPause is used) |

## Events (10 total)

| Event | Parameters |
|-------|------------|
| `PlanCreated` | planId, tenorDays, aprBps, minDeposit, maxDeposit, penaltyBps |
| `PlanUpdated` | planId, newAprBps |
| `PlanEnabled` | planId |
| `PlanDisabled` | planId |
| `DepositOpened` | depositId, owner, planId, principal, maturityAt |
| `Withdrawn` | depositId, owner, principal, interest, total |
| `EarlyWithdrawn` | depositId, owner, principal, penalty, received |
| `Renewed` | oldDepositId, newDepositId, owner, newPrincipal, newPlanId |
| `FeeReceiverUpdated` | oldReceiver, newReceiver |

## Architecture: Token Flow

```
openDeposit:
  User --[transferFrom]--> SavingCore (principal stored here)

withdraw (at maturity):
  SavingCore --[transfer]--> User (principal)
  VaultManager --[transferFrom]--> User (interest)

earlyWithdraw:
  SavingCore --[transfer]--> User (principal - penalty)
  SavingCore --[transfer]--> FeeReceiver (penalty)

renewDeposit:
  No token movement (principal stays in SavingCore)
  Old NFT -> ManualRenewed, New NFT minted

autoRenewDeposit:
  No token movement (principal stays in SavingCore)
  Old NFT -> AutoRenewed, New NFT minted
```

## Test Results

```
  SavingCore (95 tests)
    Deployment (8 tests)
    Plan Management (22 tests)
    openDeposit (13 tests)
    withdraw (10 tests)
    earlyWithdraw (8 tests)
    renewDeposit (12 tests)
    autoRenewDeposit (12 tests)
    Pause/Unpause (8 tests)
    setFeeReceiver (4 tests)
    Interest Calculation (2 tests)

Total project: 175 passing (28s)
  - Architecture: 4 tests
  - MockUSDC: 39 tests
  - VaultManager: 37 tests
  - SavingCore: 95 tests
```

## Key Design Decisions

1. **Principal stays in SavingCore, interest comes from VaultManager** - Per plan note: "có thể giữ principal trong contract, lãi từ Vault". This simplifies accounting.

2. **Renew does NOT burn old NFT** - Old NFT is marked (ManualRenewed/AutoRenewed) but remains viewable. This provides audit trail. Only withdraw burns the NFT.

3. **APR snapshot at deposit time** - Both regular deposit and auto-renew use the APR at the time of the original deposit (locked rate). Manual renew uses the NEW plan's current APR (market rate).

4. **Grace period for auto-renew = 3 days** - Prevents immediate auto-renew, gives users time to manually withdraw or renew before automation kicks in.

5. **Anyone can trigger auto-renew** - Design for keeper bots. No access restriction.

6. **Interest calculated using fixed tenor** - Interest = principal * aprBps * planTenorSeconds / (secondsPerYear * 10000). Fixed tenor, not actual elapsed time.

7. **ERC721URIStorage for NFT metadata** - Each deposit NFT has a tokenURI pointing to `term-deposit/{id}`. Can be extended to on-chain JSON metadata.

## Next Steps for Phase 5

Phase 5 will focus on:
1. Running `npx hardhat coverage` to measure test coverage
2. Analyzing uncovered lines and adding missing test cases
3. Reaching ≥90% coverage target
4. Fix any bugs discovered during coverage analysis
5. Refactor tests if needed

---
*Phase 4 complete - SavingCore (the heart of the protocol) is ready for Phase 5: Testing & Coverage*
