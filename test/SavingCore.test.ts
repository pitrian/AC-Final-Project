import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MockUSDC, VaultManager, SavingCore } from "../typechain";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SavingCore", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let feeReceiver: SignerWithAddress;
  let mockUSDC: MockUSDC;
  let vaultManager: VaultManager;
  let savingCore: SavingCore;

  const TENOR_30_DAYS = 30;
  const TENOR_90_DAYS = 90;
  const APR_10_PCT = 1000;
  const APR_5_PCT = 500;
  const MIN_DEPOSIT = 100_000_000n;
  const MAX_DEPOSIT = 10_000_000_000n;
  const PENALTY_5_PCT = 500;
  const DEPOSIT_AMOUNT = 1_000_000_000n;

  async function deployContracts() {
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    const VaultManagerFactory = await ethers.getContractFactory("VaultManager");
    vaultManager = await VaultManagerFactory.deploy(
      await mockUSDC.getAddress(),
      feeReceiver.address
    );
    await vaultManager.waitForDeployment();

    const SavingCoreFactory = await ethers.getContractFactory("SavingCore");
    savingCore = await SavingCoreFactory.deploy(
      await mockUSDC.getAddress(),
      await vaultManager.getAddress(),
      feeReceiver.address
    );
    await savingCore.waitForDeployment();

    await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT * 100n);
    await mockUSDC.mint(user1.address, DEPOSIT_AMOUNT * 10n);
    await mockUSDC.mint(user2.address, DEPOSIT_AMOUNT * 10n);
    await mockUSDC.mint(user3.address, DEPOSIT_AMOUNT * 10n);

    await mockUSDC.approve(await vaultManager.getAddress(), DEPOSIT_AMOUNT * 50n);
    await vaultManager.fundVault(DEPOSIT_AMOUNT * 50n);
    await vaultManager.approveSpender(await savingCore.getAddress(), DEPOSIT_AMOUNT * 100n);
  }

  async function createPlan(tenorDays: number, aprBps: number) {
    await savingCore.createPlan(tenorDays, aprBps, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT);
    const planId = await savingCore.planCount();
    await savingCore.enablePlan(planId);
    return planId;
  }

  async function openDeposit(user: SignerWithAddress, planId: bigint | number, amount: bigint) {
    await mockUSDC.connect(user).approve(await savingCore.getAddress(), amount);
    return savingCore.connect(user).openDeposit(planId, amount);
  }

  beforeEach(async () => {
    [owner, user1, user2, user3, feeReceiver] = await ethers.getSigners();
    await deployContracts();
  });

  describe("Deployment", function () {
    it("Should set correct underlying token", async function () {
      expect(await savingCore.underlyingToken()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set correct vault manager", async function () {
      expect(await savingCore.vaultManager()).to.equal(await vaultManager.getAddress());
    });

    it("Should set correct fee receiver", async function () {
      expect(await savingCore.feeReceiver()).to.equal(feeReceiver.address);
    });

    it("Should have correct NFT name and symbol", async function () {
      expect(await savingCore.name()).to.equal("Term Deposit Certificate");
      expect(await savingCore.symbol()).to.equal("TDC");
    });

    it("Should start with zero planCount and depositCount", async function () {
      expect(await savingCore.planCount()).to.equal(0n);
      expect(await savingCore.depositCount()).to.equal(0n);
    });

    it("Should revert with zero underlying token", async function () {
      const Factory = await ethers.getContractFactory("SavingCore");
      await expect(Factory.deploy(ethers.ZeroAddress, await vaultManager.getAddress(), feeReceiver.address))
        .to.be.revertedWithCustomError(savingCore, "ZeroAddress");
    });

    it("Should revert with zero vault manager", async function () {
      const Factory = await ethers.getContractFactory("SavingCore");
      await expect(Factory.deploy(await mockUSDC.getAddress(), ethers.ZeroAddress, feeReceiver.address))
        .to.be.revertedWithCustomError(savingCore, "ZeroAddress");
    });

    it("Should revert with zero fee receiver", async function () {
      const Factory = await ethers.getContractFactory("SavingCore");
      await expect(Factory.deploy(await mockUSDC.getAddress(), await vaultManager.getAddress(), ethers.ZeroAddress))
        .to.be.revertedWithCustomError(savingCore, "ZeroAddress");
    });
  });

  describe("Plan Management", function () {
    describe("createPlan", function () {
      it("Should create a new plan", async function () {
        await savingCore.createPlan(TENOR_30_DAYS, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT);
        expect(await savingCore.planCount()).to.equal(1n);
      });

      it("Should set plan fields correctly", async function () {
        await savingCore.createPlan(TENOR_30_DAYS, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT);
        const plan = await savingCore.getPlan(1);
        expect(plan.tenorDays).to.equal(BigInt(TENOR_30_DAYS));
        expect(plan.aprBps).to.equal(BigInt(APR_10_PCT));
        expect(plan.minDeposit).to.equal(MIN_DEPOSIT);
        expect(plan.maxDeposit).to.equal(MAX_DEPOSIT);
        expect(plan.penaltyBps).to.equal(BigInt(PENALTY_5_PCT));
        expect(plan.enabled).to.equal(false);
      });

      it("Should emit PlanCreated event", async function () {
        await expect(savingCore.createPlan(TENOR_30_DAYS, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT))
          .to.emit(savingCore, "PlanCreated")
          .withArgs(1n, TENOR_30_DAYS, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT);
      });

      it("Should revert with zero APR", async function () {
        await expect(savingCore.createPlan(TENOR_30_DAYS, 0, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT))
          .to.be.revertedWithCustomError(savingCore, "InvalidApr");
      });

      it("Should revert with zero tenor", async function () {
        await expect(savingCore.createPlan(0, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT))
          .to.be.revertedWithCustomError(savingCore, "InvalidTenor");
      });

      it("Should revert when non-owner creates plan", async function () {
        await expect(savingCore.connect(user1).createPlan(TENOR_30_DAYS, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT))
          .to.be.revertedWithCustomError(savingCore, "OwnableUnauthorizedAccount");
      });
    });

    describe("updatePlan", function () {
      beforeEach(async function () {
        await savingCore.createPlan(TENOR_30_DAYS, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT);
      });

      it("Should update plan APR", async function () {
        await savingCore.updatePlan(1, APR_5_PCT);
        const plan = await savingCore.getPlan(1);
        expect(plan.aprBps).to.equal(BigInt(APR_5_PCT));
      });

      it("Should emit PlanUpdated event", async function () {
        await expect(savingCore.updatePlan(1, APR_5_PCT))
          .to.emit(savingCore, "PlanUpdated")
          .withArgs(1n, APR_5_PCT);
      });

      it("Should revert with zero APR", async function () {
        await expect(savingCore.updatePlan(1, 0))
          .to.be.revertedWithCustomError(savingCore, "InvalidApr");
      });

      it("Should revert for non-existent plan", async function () {
        await expect(savingCore.updatePlan(99, APR_5_PCT))
          .to.be.revertedWithCustomError(savingCore, "PlanDoesNotExist");
      });

      it("Should revert when non-owner updates plan", async function () {
        await expect(savingCore.connect(user1).updatePlan(1, APR_5_PCT))
          .to.be.revertedWithCustomError(savingCore, "OwnableUnauthorizedAccount");
      });
    });

    describe("enablePlan / disablePlan", function () {
      beforeEach(async function () {
        await savingCore.createPlan(TENOR_30_DAYS, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT);
      });

      it("Should enable a plan", async function () {
        await savingCore.enablePlan(1);
        const plan = await savingCore.getPlan(1);
        expect(plan.enabled).to.equal(true);
      });

      it("Should emit PlanEnabled event", async function () {
        await expect(savingCore.enablePlan(1))
          .to.emit(savingCore, "PlanEnabled")
          .withArgs(1n);
      });

      it("Should disable a plan", async function () {
        await savingCore.enablePlan(1);
        await savingCore.disablePlan(1);
        const plan = await savingCore.getPlan(1);
        expect(plan.enabled).to.equal(false);
      });

      it("Should emit PlanDisabled event", async function () {
        await expect(savingCore.disablePlan(1))
          .to.emit(savingCore, "PlanDisabled")
          .withArgs(1n);
      });

      it("Should revert for non-existent plan", async function () {
        await expect(savingCore.enablePlan(99))
          .to.be.revertedWithCustomError(savingCore, "PlanDoesNotExist");
      });
    });

    describe("getPlan", function () {
      beforeEach(async function () {
        await savingCore.createPlan(TENOR_30_DAYS, APR_10_PCT, MIN_DEPOSIT, MAX_DEPOSIT, PENALTY_5_PCT);
      });

      it("Should return plan details", async function () {
        const plan = await savingCore.getPlan(1);
        expect(plan.tenorDays).to.equal(BigInt(TENOR_30_DAYS));
        expect(plan.aprBps).to.equal(BigInt(APR_10_PCT));
      });

      it("Should revert for plan ID 0", async function () {
        await expect(savingCore.getPlan(0))
          .to.be.revertedWithCustomError(savingCore, "PlanDoesNotExist");
      });

      it("Should revert for non-existent plan", async function () {
        await expect(savingCore.getPlan(99))
          .to.be.revertedWithCustomError(savingCore, "PlanDoesNotExist");
      });
    });
  });

  describe("openDeposit", function () {
    let planId: bigint;

    beforeEach(async function () {
      planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
    });

    it("Should open deposit and mint NFT", async function () {
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);

      expect(await savingCore.depositCount()).to.equal(1n);
      expect(await savingCore.ownerOf(1)).to.equal(user1.address);
      expect(await savingCore.balanceOf(user1.address)).to.equal(1n);
    });

    it("Should transfer tokens from user to SavingCore", async function () {
      const balanceBefore = await mockUSDC.balanceOf(user1.address);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      const balanceAfter = await mockUSDC.balanceOf(user1.address);

      expect(balanceAfter).to.equal(balanceBefore - DEPOSIT_AMOUNT);
    });

    it("Should store deposit info correctly", async function () {
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      const deposit = await savingCore.getDeposit(1);

      expect(deposit.owner).to.equal(user1.address);
      expect(deposit.planId).to.equal(1n);
      expect(deposit.principal).to.equal(DEPOSIT_AMOUNT);
      expect(deposit.aprBpsAtOpen).to.equal(BigInt(APR_10_PCT));
      expect(deposit.penaltyBpsAtOpen).to.equal(BigInt(PENALTY_5_PCT));
      expect(deposit.status).to.equal(0n);
    });

    it("Should set correct maturity time", async function () {
      const beforeTime = await time.latest();
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      const deposit = await savingCore.getDeposit(1);

      const expectedMaturity = beforeTime + TENOR_30_DAYS * 86400;
      expect(deposit.maturityAt).to.be.closeTo(BigInt(expectedMaturity), 5n);
    });

    it("Should emit DepositOpened event", async function () {
      const tx = await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      const receipt = await tx.wait();
      const event = receipt?.logs?.find((l: any) => l.fragment && l.fragment.name === "DepositOpened");
      expect(event).to.not.be.undefined;
      expect(event?.args?.[0]).to.equal(1n);
      expect(event?.args?.[1]).to.equal(user1.address);
      expect(event?.args?.[2]).to.equal(1n);
      expect(event?.args?.[3]).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should allow multiple deposits from same user", async function () {
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);

      expect(await savingCore.balanceOf(user1.address)).to.equal(2n);
      expect(await savingCore.depositCount()).to.equal(2n);
    });

    it("Should assign sequential deposit IDs", async function () {
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      await openDeposit(user2, planId, DEPOSIT_AMOUNT);

      expect(await savingCore.ownerOf(1)).to.equal(user1.address);
      expect(await savingCore.ownerOf(2)).to.equal(user2.address);
    });

    it("Should revert for non-existent plan", async function () {
      await expect(openDeposit(user1, 99, DEPOSIT_AMOUNT))
        .to.be.revertedWithCustomError(savingCore, "PlanDoesNotExist");
    });

    it("Should revert for disabled plan", async function () {
      await savingCore.disablePlan(planId);
      await mockUSDC.connect(user1).approve(await savingCore.getAddress(), DEPOSIT_AMOUNT);
      await expect(savingCore.connect(user1).openDeposit(planId, DEPOSIT_AMOUNT))
        .to.be.revertedWithCustomError(savingCore, "PlanNotEnabled");
    });

    it("Should revert when deposit below minimum", async function () {
      await expect(openDeposit(user1, planId, MIN_DEPOSIT - 1n))
        .to.be.revertedWithCustomError(savingCore, "DepositBelowMinimum");
    });

    it("Should revert when deposit above maximum", async function () {
      await expect(openDeposit(user1, planId, MAX_DEPOSIT + 1n))
        .to.be.revertedWithCustomError(savingCore, "DepositAboveMaximum");
    });

    it("Should revert when paused", async function () {
      await savingCore.pause();
      await mockUSDC.connect(user1).approve(await savingCore.getAddress(), DEPOSIT_AMOUNT);
      await expect(savingCore.connect(user1).openDeposit(planId, DEPOSIT_AMOUNT))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });
  });

  describe("withdraw", function () {
    let planId: bigint;
    let depositId: bigint;

    beforeEach(async function () {
      planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      depositId = 1n;

      await time.increase(TENOR_30_DAYS * 86400 + 1);
    });

    it("Should withdraw successfully at maturity", async function () {
      const balanceBefore = await mockUSDC.balanceOf(user1.address);
      await savingCore.connect(user1).withdraw(depositId);
      const balanceAfter = await mockUSDC.balanceOf(user1.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should calculate correct interest", async function () {
      const tenorSeconds = BigInt(TENOR_30_DAYS * 86400);
      const expectedInterest = (DEPOSIT_AMOUNT * BigInt(APR_10_PCT) * tenorSeconds) / (31536000n * 10000n);

      const balanceBefore = await mockUSDC.balanceOf(user1.address);
      await savingCore.connect(user1).withdraw(depositId);
      const balanceAfter = await mockUSDC.balanceOf(user1.address);

      const received = balanceAfter - balanceBefore;
      expect(received).to.equal(DEPOSIT_AMOUNT + expectedInterest);
    });

    it("Should emit Withdrawn event with correct values", async function () {
      const tenorSeconds = BigInt(TENOR_30_DAYS * 86400);
      const expectedInterest = (DEPOSIT_AMOUNT * BigInt(APR_10_PCT) * tenorSeconds) / (31536000n * 10000n);

      await expect(savingCore.connect(user1).withdraw(depositId))
        .to.emit(savingCore, "Withdrawn")
        .withArgs(depositId, user1.address, DEPOSIT_AMOUNT, expectedInterest, DEPOSIT_AMOUNT + expectedInterest);
    });

    it("Should burn the NFT after withdrawal", async function () {
      await savingCore.connect(user1).withdraw(depositId);
      await expect(savingCore.ownerOf(1)).to.be.reverted;
    });

    it("Should update deposit status to Withdrawn", async function () {
      await savingCore.connect(user1).withdraw(depositId);
      const deposit = await savingCore.getDeposit(depositId);
      expect(deposit.status).to.equal(1n);
    });

    it("Should revert when not owner", async function () {
      await expect(savingCore.connect(user2).withdraw(depositId))
        .to.be.revertedWithCustomError(savingCore, "NotDepositOwner");
    });

    it("Should revert when already withdrawn", async function () {
      await savingCore.connect(user1).withdraw(depositId);
      await expect(savingCore.connect(user1).withdraw(depositId))
        .to.be.revertedWithCustomError(savingCore, "AlreadyWithdrawn");
    });

    it("Should revert when not yet matured", async function () {
      await deployContracts();
      planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);

      await expect(savingCore.connect(user1).withdraw(1n))
        .to.be.revertedWithCustomError(savingCore, "DepositNotMatured");
    });

    it("Should revert for non-existent deposit", async function () {
      await expect(savingCore.connect(user1).withdraw(99n))
        .to.be.revertedWithCustomError(savingCore, "PlanDoesNotExist");
    });

    it("Should revert when paused", async function () {
      await savingCore.pause();
      await expect(savingCore.connect(user1).withdraw(depositId))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });
  });

  describe("earlyWithdraw", function () {
    let planId: bigint;
    let depositId: bigint;

    beforeEach(async function () {
      planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      depositId = 1n;

      await time.increase(10 * 86400);
    });

    it("Should early withdraw with penalty", async function () {
      const balanceBefore = await mockUSDC.balanceOf(user1.address);
      await savingCore.connect(user1).earlyWithdraw(depositId);
      const balanceAfter = await mockUSDC.balanceOf(user1.address);

      const penalty = (DEPOSIT_AMOUNT * BigInt(PENALTY_5_PCT)) / 10000n;
      const expected = DEPOSIT_AMOUNT - penalty;
      expect(balanceAfter).to.equal(balanceBefore + expected);
    });

    it("Should send penalty to feeReceiver", async function () {
      const feeBalanceBefore = await mockUSDC.balanceOf(feeReceiver.address);
      await savingCore.connect(user1).earlyWithdraw(depositId);
      const feeBalanceAfter = await mockUSDC.balanceOf(feeReceiver.address);

      const penalty = (DEPOSIT_AMOUNT * BigInt(PENALTY_5_PCT)) / 10000n;
      expect(feeBalanceAfter).to.equal(feeBalanceBefore + penalty);
    });

    it("Should emit EarlyWithdrawn event", async function () {
      const penalty = (DEPOSIT_AMOUNT * BigInt(PENALTY_5_PCT)) / 10000n;
      const received = DEPOSIT_AMOUNT - penalty;

      await expect(savingCore.connect(user1).earlyWithdraw(depositId))
        .to.emit(savingCore, "EarlyWithdrawn")
        .withArgs(depositId, user1.address, DEPOSIT_AMOUNT, penalty, received);
    });

    it("Should burn the NFT after early withdrawal", async function () {
      await savingCore.connect(user1).earlyWithdraw(depositId);
      await expect(savingCore.ownerOf(1)).to.be.reverted;
    });

    it("Should revert when already matured", async function () {
      await time.increase(TENOR_30_DAYS * 86400);
      await expect(savingCore.connect(user1).earlyWithdraw(depositId))
        .to.be.revertedWithCustomError(savingCore, "DepositNotMatured");
    });

    it("Should revert when not owner", async function () {
      await expect(savingCore.connect(user2).earlyWithdraw(depositId))
        .to.be.revertedWithCustomError(savingCore, "NotDepositOwner");
    });

    it("Should revert when already withdrawn", async function () {
      await savingCore.connect(user1).earlyWithdraw(depositId);
      await expect(savingCore.connect(user1).earlyWithdraw(depositId))
        .to.be.revertedWithCustomError(savingCore, "AlreadyWithdrawn");
    });

    it("Should revert when paused", async function () {
      await savingCore.pause();
      await expect(savingCore.connect(user1).earlyWithdraw(depositId))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });
  });

  describe("renewDeposit (Manual)", function () {
    let planId30: bigint;
    let planId90: bigint;
    let depositId: bigint;

    beforeEach(async function () {
      planId30 = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      planId90 = await createPlan(TENOR_90_DAYS, APR_5_PCT);
      await openDeposit(user1, planId30, DEPOSIT_AMOUNT);
      depositId = 1n;

      await time.increase(TENOR_30_DAYS * 86400 + 1);
    });

    it("Should renew deposit successfully", async function () {
      await savingCore.connect(user1).renewDeposit(depositId, planId90);

      const newDeposit = await savingCore.getDeposit(2n);
      expect(newDeposit.owner).to.equal(user1.address);
      expect(newDeposit.planId).to.equal(planId90);
      expect(newDeposit.status).to.equal(0n);
    });

    it("Should calculate interest and compound principal", async function () {
      const tenorSeconds = BigInt(TENOR_30_DAYS * 86400);
      const expectedInterest = (DEPOSIT_AMOUNT * BigInt(APR_10_PCT) * tenorSeconds) / (31536000n * 10000n);
      const expectedNewPrincipal = DEPOSIT_AMOUNT + expectedInterest;

      await savingCore.connect(user1).renewDeposit(depositId, planId90);
      const newDeposit = await savingCore.getDeposit(2n);

      expect(newDeposit.principal).to.equal(expectedNewPrincipal);
    });

    it("Should use new plan APR (market rate)", async function () {
      await savingCore.connect(user1).renewDeposit(depositId, planId90);
      const newDeposit = await savingCore.getDeposit(2n);

      expect(newDeposit.aprBpsAtOpen).to.equal(BigInt(APR_5_PCT));
    });

    it("Should use new plan penalty", async function () {
      await savingCore.connect(user1).renewDeposit(depositId, planId90);
      const newDeposit = await savingCore.getDeposit(2n);

      expect(newDeposit.penaltyBpsAtOpen).to.equal(BigInt(PENALTY_5_PCT));
    });

    it("Should mark old deposit as ManualRenewed", async function () {
      await savingCore.connect(user1).renewDeposit(depositId, planId90);
      const oldDeposit = await savingCore.getDeposit(depositId);

      expect(oldDeposit.status).to.equal(2n);
    });

    it("Should mint new NFT to owner", async function () {
      await savingCore.connect(user1).renewDeposit(depositId, planId90);

      expect(await savingCore.balanceOf(user1.address)).to.equal(2n);
      expect(await savingCore.ownerOf(2n)).to.equal(user1.address);
    });

    it("Should emit Renewed event", async function () {
      const tenorSeconds = BigInt(TENOR_30_DAYS * 86400);
      const expectedInterest = (DEPOSIT_AMOUNT * BigInt(APR_10_PCT) * tenorSeconds) / (31536000n * 10000n);
      const expectedNewPrincipal = DEPOSIT_AMOUNT + expectedInterest;

      await expect(savingCore.connect(user1).renewDeposit(depositId, planId90))
        .to.emit(savingCore, "Renewed")
        .withArgs(depositId, 2n, user1.address, expectedNewPrincipal, planId90);
    });

    it("Should revert when not yet matured", async function () {
      await deployContracts();
      planId30 = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      planId90 = await createPlan(TENOR_90_DAYS, APR_5_PCT);
      await openDeposit(user1, planId30, DEPOSIT_AMOUNT);

      await expect(savingCore.connect(user1).renewDeposit(1n, planId90))
        .to.be.revertedWithCustomError(savingCore, "DepositNotMatured");
    });

    it("Should revert when new plan not enabled", async function () {
      await savingCore.disablePlan(planId90);
      await expect(savingCore.connect(user1).renewDeposit(depositId, planId90))
        .to.be.revertedWithCustomError(savingCore, "PlanNotEnabled");
    });

    it("Should revert when already renewed", async function () {
      await savingCore.connect(user1).renewDeposit(depositId, planId90);
      await expect(savingCore.connect(user1).renewDeposit(depositId, planId30))
        .to.be.revertedWithCustomError(savingCore, "AlreadyRenewed");
    });

    it("Should revert when not owner", async function () {
      await expect(savingCore.connect(user2).renewDeposit(depositId, planId90))
        .to.be.revertedWithCustomError(savingCore, "NotDepositOwner");
    });

    it("Should revert when paused", async function () {
      await savingCore.pause();
      await expect(savingCore.connect(user1).renewDeposit(depositId, planId90))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });
  });

  describe("autoRenewDeposit", function () {
    let planId: bigint;
    let depositId: bigint;

    beforeEach(async function () {
      planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      depositId = 1n;

      await time.increase(TENOR_30_DAYS * 86400 + 3 * 86400 + 1);
    });

    it("Should auto renew after grace period", async function () {
      await savingCore.connect(user2).autoRenewDeposit(depositId);

      const newDeposit = await savingCore.getDeposit(2n);
      expect(newDeposit.owner).to.equal(user1.address);
      expect(newDeposit.status).to.equal(0n);
    });

    it("Should use locked APR (original plan APR, not current)", async function () {
      await savingCore.updatePlan(planId, APR_5_PCT);
      await savingCore.connect(user2).autoRenewDeposit(depositId);

      const newDeposit = await savingCore.getDeposit(2n);
      expect(newDeposit.aprBpsAtOpen).to.equal(BigInt(APR_10_PCT));
    });

    it("Should use locked penalty from original deposit", async function () {
      await savingCore.connect(user2).autoRenewDeposit(depositId);
      const newDeposit = await savingCore.getDeposit(2n);

      expect(newDeposit.penaltyBpsAtOpen).to.equal(BigInt(PENALTY_5_PCT));
    });

    it("Should compound principal with interest", async function () {
      const tenorSeconds = BigInt(TENOR_30_DAYS * 86400);
      const expectedInterest = (DEPOSIT_AMOUNT * BigInt(APR_10_PCT) * tenorSeconds) / (31536000n * 10000n);
      const expectedNewPrincipal = DEPOSIT_AMOUNT + expectedInterest;

      await savingCore.connect(user2).autoRenewDeposit(depositId);
      const newDeposit = await savingCore.getDeposit(2n);

      expect(newDeposit.principal).to.equal(expectedNewPrincipal);
    });

    it("Should keep same plan for auto-renew", async function () {
      await savingCore.connect(user2).autoRenewDeposit(depositId);
      const newDeposit = await savingCore.getDeposit(2n);

      expect(newDeposit.planId).to.equal(planId);
    });

    it("Should mark old deposit as AutoRenewed", async function () {
      await savingCore.connect(user2).autoRenewDeposit(depositId);
      const oldDeposit = await savingCore.getDeposit(depositId);

      expect(oldDeposit.status).to.equal(3n);
    });

    it("Should allow anyone to trigger", async function () {
      await expect(savingCore.connect(user2).autoRenewDeposit(depositId)).to.not.be.reverted;
    });

    it("Should mint new NFT to owner", async function () {
      await savingCore.connect(user2).autoRenewDeposit(depositId);

      expect(await savingCore.balanceOf(user1.address)).to.equal(2n);
      expect(await savingCore.ownerOf(2n)).to.equal(user1.address);
    });

    it("Should emit Renewed event", async function () {
      const tenorSeconds = BigInt(TENOR_30_DAYS * 86400);
      const expectedInterest = (DEPOSIT_AMOUNT * BigInt(APR_10_PCT) * tenorSeconds) / (31536000n * 10000n);
      const expectedNewPrincipal = DEPOSIT_AMOUNT + expectedInterest;

      await expect(savingCore.connect(user2).autoRenewDeposit(depositId))
        .to.emit(savingCore, "Renewed")
        .withArgs(depositId, 2n, user1.address, expectedNewPrincipal, planId);
    });

    it("Should revert before grace period", async function () {
      await deployContracts();
      planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);

      await time.increase(TENOR_30_DAYS * 86400 + 1);

      await expect(savingCore.connect(user2).autoRenewDeposit(1n))
        .to.be.revertedWithCustomError(savingCore, "GracePeriodNotOver");
    });

    it("Should revert when already renewed", async function () {
      await savingCore.connect(user2).autoRenewDeposit(depositId);
      await expect(savingCore.connect(user2).autoRenewDeposit(depositId))
        .to.be.revertedWithCustomError(savingCore, "AlreadyRenewed");
    });

    it("Should revert when paused", async function () {
      await savingCore.pause();
      await expect(savingCore.connect(user2).autoRenewDeposit(depositId))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should pause successfully", async function () {
      await savingCore.pause();
      expect(await savingCore.isPaused()).to.equal(true);
    });

    it("Should block openDeposit when paused", async function () {
      const planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await savingCore.pause();
      await mockUSDC.connect(user1).approve(await savingCore.getAddress(), DEPOSIT_AMOUNT);
      await expect(savingCore.connect(user1).openDeposit(planId, DEPOSIT_AMOUNT))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });

    it("Should block withdraw when paused", async function () {
      const planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      await time.increase(TENOR_30_DAYS * 86400 + 1);

      await savingCore.pause();
      await expect(savingCore.connect(user1).withdraw(1n))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });

    it("Should block renewDeposit when paused", async function () {
      const planId30 = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      const planId90 = await createPlan(TENOR_90_DAYS, APR_5_PCT);
      await openDeposit(user1, planId30, DEPOSIT_AMOUNT);
      await time.increase(TENOR_30_DAYS * 86400 + 1);

      await savingCore.pause();
      await expect(savingCore.connect(user1).renewDeposit(1n, planId90))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });

    it("Should block autoRenewDeposit when paused", async function () {
      const planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      await time.increase(TENOR_30_DAYS * 86400 + 3 * 86400 + 1);

      await savingCore.pause();
      await expect(savingCore.connect(user2).autoRenewDeposit(1n))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });

    it("Should block earlyWithdraw when paused", async function () {
      const planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      await time.increase(10 * 86400);

      await savingCore.pause();
      await expect(savingCore.connect(user1).earlyWithdraw(1n))
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });

    it("Should restore functionality after unpause", async function () {
      const planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
      await savingCore.pause();
      await savingCore.unpause();

      await time.increase(TENOR_30_DAYS * 86400 + 1);
      await expect(savingCore.connect(user1).withdraw(1n)).to.not.be.reverted;
    });

    it("Should revert when non-owner pauses", async function () {
      await expect(savingCore.connect(user1).pause())
        .to.be.revertedWithCustomError(savingCore, "OwnableUnauthorizedAccount");
    });
  });

  describe("setFeeReceiver", function () {
    it("Should update fee receiver", async function () {
      await savingCore.setFeeReceiver(user2.address);
      expect(await savingCore.feeReceiver()).to.equal(user2.address);
    });

    it("Should emit FeeReceiverUpdated event", async function () {
      await expect(savingCore.setFeeReceiver(user2.address))
        .to.emit(savingCore, "FeeReceiverUpdated")
        .withArgs(feeReceiver.address, user2.address);
    });

    it("Should revert with zero address", async function () {
      await expect(savingCore.setFeeReceiver(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(savingCore, "ZeroAddress");
    });

    it("Should revert when non-owner calls", async function () {
      await expect(savingCore.connect(user1).setFeeReceiver(user2.address))
        .to.be.revertedWithCustomError(savingCore, "OwnableUnauthorizedAccount");
    });
  });

  describe("Interest Calculation", function () {
    it("Should calculate 10% APR for 30 days correctly", async function () {
      const principal = 1_000_000_000n;
      const aprBps = 1000n;
      const tenorSeconds = BigInt(30 * 86400);
      const expected = (principal * aprBps * tenorSeconds) / (31536000n * 10000n);

      const planId = await createPlan(30, 1000);
      await openDeposit(user1, planId, principal);
      await time.increase(30 * 86400 + 1);

      const balanceBefore = await mockUSDC.balanceOf(user1.address);
      await savingCore.connect(user1).withdraw(1n);
      const balanceAfter = await mockUSDC.balanceOf(user1.address);

      expect(balanceAfter - balanceBefore).to.equal(principal + expected);
    });

    it("Should calculate 5% APR for 90 days correctly", async function () {
      const principal = 5_000_000_000n;
      const aprBps = 500n;
      const tenorSeconds = BigInt(90 * 86400);
      const expected = (principal * aprBps * tenorSeconds) / (31536000n * 10000n);

      const planId = await createPlan(90, 500);
      await openDeposit(user1, planId, principal);
      await time.increase(90 * 86400 + 1);

      const balanceBefore = await mockUSDC.balanceOf(user1.address);
      await savingCore.connect(user1).withdraw(1n);
      const balanceAfter = await mockUSDC.balanceOf(user1.address);

      expect(balanceAfter - balanceBefore).to.equal(principal + expected);
    });
  });
  describe("ERC721 Metadata", function () {
    let planId: bigint;

    beforeEach(async function () {
      planId = await createPlan(TENOR_30_DAYS, APR_10_PCT);
      await openDeposit(user1, planId, DEPOSIT_AMOUNT);
    });

    it("Should return correct tokenURI", async function () {
      const uri = await savingCore.tokenURI(1);
      expect(uri).to.equal("term-deposit/1");
    });

    it("Should support ERC721 interface", async function () {
      const ERC721_INTERFACE = "0x80ac58cd";
      expect(await savingCore.supportsInterface(ERC721_INTERFACE)).to.equal(true);
    });

    it("Should support ERC721Metadata interface", async function () {
      const METADATA_INTERFACE = "0x5b5e139f";
      expect(await savingCore.supportsInterface(METADATA_INTERFACE)).to.equal(true);
    });

    it("Should support ERC721URIStorage interface", async function () {
      const URI_STORAGE_INTERFACE = "0x01ffc9a7";
      expect(await savingCore.supportsInterface(URI_STORAGE_INTERFACE)).to.equal(true);
    });
  });
});
