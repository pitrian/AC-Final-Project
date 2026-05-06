import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MockUSDC, VaultManager } from "../typechain";

describe("VaultManager", function () {
  let owner: SignerWithAddress;
  let funder: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let mockUSDC: MockUSDC;
  let vaultManager: VaultManager;

  const FUND_AMOUNT = 1_000_000_000n;
  const WITHDRAW_AMOUNT = 100_000_000n;

  beforeEach(async () => {
    [owner, funder, addr1, addr2] = await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    await mockUSDC.mint(funder.address, FUND_AMOUNT * 10n);
    await mockUSDC.mint(addr2.address, FUND_AMOUNT * 10n);

    const VaultManagerFactory = await ethers.getContractFactory("VaultManager");
    vaultManager = await VaultManagerFactory.deploy(
      await mockUSDC.getAddress(),
      addr1.address
    );
    await vaultManager.waitForDeployment();

    await mockUSDC.connect(funder).approve(await vaultManager.getAddress(), FUND_AMOUNT * 10n);
    await mockUSDC.connect(addr2).approve(await vaultManager.getAddress(), FUND_AMOUNT * 10n);
  });

  describe("Deployment", function () {
    it("Should set correct underlying token", async function () {
      expect(await vaultManager.underlyingToken()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set correct initial fee receiver", async function () {
      expect(await vaultManager.feeReceiver()).to.equal(addr1.address);
    });

    it("Should have zero initial vault balance", async function () {
      expect(await vaultManager.vaultBalance()).to.equal(0n);
    });

    it("Should set deployer as owner", async function () {
      expect(await vaultManager.owner()).to.equal(owner.address);
    });

    it("Should revert with zero underlying token", async function () {
      const VaultManagerFactory = await ethers.getContractFactory("VaultManager");
      await expect(VaultManagerFactory.deploy(ethers.ZeroAddress, addr1.address))
        .to.be.revertedWithCustomError(vaultManager, "ZeroAddress");
    });

    it("Should revert with zero fee receiver", async function () {
      const VaultManagerFactory = await ethers.getContractFactory("VaultManager");
      await expect(VaultManagerFactory.deploy(await mockUSDC.getAddress(), ethers.ZeroAddress))
        .to.be.revertedWithCustomError(vaultManager, "ZeroAddress");
    });
  });

  describe("fundVault", function () {
    it("Should fund vault successfully", async function () {
      await vaultManager.connect(funder).fundVault(FUND_AMOUNT);

      expect(await vaultManager.vaultBalance()).to.equal(FUND_AMOUNT);
      expect(await mockUSDC.balanceOf(await vaultManager.getAddress())).to.equal(FUND_AMOUNT);
    });

    it("Should emit VaultFunded event", async function () {
      await expect(vaultManager.connect(funder).fundVault(FUND_AMOUNT))
        .to.emit(vaultManager, "VaultFunded")
        .withArgs(funder.address, FUND_AMOUNT);
    });

    it("Should accumulate balance from multiple funders", async function () {
      await vaultManager.connect(funder).fundVault(FUND_AMOUNT);
      await vaultManager.connect(addr2).fundVault(FUND_AMOUNT);

      expect(await vaultManager.vaultBalance()).to.equal(FUND_AMOUNT * 2n);
    });

    it("Should revert when paused", async function () {
      await vaultManager.connect(owner).pause();
      await expect(vaultManager.connect(funder).fundVault(FUND_AMOUNT))
        .to.be.revertedWithCustomError(vaultManager, "EnforcedPause");
    });

    it("Should revert on zero amount", async function () {
      await expect(vaultManager.connect(funder).fundVault(0n))
        .to.be.revertedWithCustomError(vaultManager, "ZeroAddress");
    });

    it("Should transfer tokens from funder to contract", async function () {
      const balanceBefore = await mockUSDC.balanceOf(funder.address);
      await vaultManager.connect(funder).fundVault(FUND_AMOUNT);
      const balanceAfter = await mockUSDC.balanceOf(funder.address);

      expect(balanceAfter).to.equal(balanceBefore - FUND_AMOUNT);
    });

    it("Should revert when insufficient allowance", async function () {
      await expect(vaultManager.connect(addr1).fundVault(FUND_AMOUNT))
        .to.be.revertedWithCustomError(mockUSDC, "ERC20InsufficientAllowance");
    });
  });

  describe("withdrawVault", function () {
    beforeEach(async function () {
      await vaultManager.connect(funder).fundVault(FUND_AMOUNT * 2n);
    });

    it("Should withdraw successfully", async function () {
      const contractBalanceBefore = await mockUSDC.balanceOf(await vaultManager.getAddress());
      const receiverBalanceBefore = await mockUSDC.balanceOf(addr2.address);

      await vaultManager.connect(owner).withdrawVault(addr2.address, WITHDRAW_AMOUNT);

      expect(await vaultManager.vaultBalance()).to.equal(FUND_AMOUNT * 2n - WITHDRAW_AMOUNT);
      expect(await mockUSDC.balanceOf(await vaultManager.getAddress())).to.equal(contractBalanceBefore - WITHDRAW_AMOUNT);
      expect(await mockUSDC.balanceOf(addr2.address)).to.equal(receiverBalanceBefore + WITHDRAW_AMOUNT);
    });

    it("Should emit VaultWithdrawn event", async function () {
      await expect(vaultManager.connect(owner).withdrawVault(addr2.address, WITHDRAW_AMOUNT))
        .to.emit(vaultManager, "VaultWithdrawn")
        .withArgs(addr2.address, WITHDRAW_AMOUNT);
    });

    it("Should revert when withdrawing more than vault balance", async function () {
      await expect(vaultManager.connect(owner).withdrawVault(addr2.address, FUND_AMOUNT * 3n))
        .to.be.revertedWithCustomError(vaultManager, "InsufficientVaultBalance");
    });

    it("Should revert when non-owner calls withdrawVault", async function () {
      await expect(vaultManager.connect(addr1).withdrawVault(addr2.address, WITHDRAW_AMOUNT))
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });

    it("Should revert when withdrawing to zero address", async function () {
      await expect(vaultManager.connect(owner).withdrawVault(ethers.ZeroAddress, WITHDRAW_AMOUNT))
        .to.be.revertedWithCustomError(vaultManager, "ZeroAddress");
    });

    it("Should revert when withdrawing zero amount", async function () {
      await expect(vaultManager.connect(owner).withdrawVault(addr2.address, 0n))
        .to.be.revertedWithCustomError(vaultManager, "ZeroAddress");
    });

    it("Should allow withdrawing exact vault balance", async function () {
      const totalBalance = await vaultManager.vaultBalance();
      await vaultManager.connect(owner).withdrawVault(addr2.address, totalBalance);

      expect(await vaultManager.vaultBalance()).to.equal(0n);
    });
  });

  describe("setFeeReceiver", function () {
    it("Should update fee receiver", async function () {
      await vaultManager.connect(owner).setFeeReceiver(addr2.address);
      expect(await vaultManager.feeReceiver()).to.equal(addr2.address);
    });

    it("Should emit FeeReceiverUpdated event", async function () {
      await expect(vaultManager.connect(owner).setFeeReceiver(addr2.address))
        .to.emit(vaultManager, "FeeReceiverUpdated")
        .withArgs(addr1.address, addr2.address);
    });

    it("Should revert when non-owner calls setFeeReceiver", async function () {
      await expect(vaultManager.connect(addr1).setFeeReceiver(addr2.address))
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });

    it("Should revert when setting zero address as fee receiver", async function () {
      await expect(vaultManager.connect(owner).setFeeReceiver(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(vaultManager, "ZeroAddress");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should pause successfully", async function () {
      await vaultManager.connect(owner).pause();
      expect(await vaultManager.isPaused()).to.equal(true);
    });

    it("Should block fundVault when paused", async function () {
      await vaultManager.connect(owner).pause();
      await expect(vaultManager.connect(funder).fundVault(FUND_AMOUNT))
        .to.be.revertedWithCustomError(vaultManager, "EnforcedPause");
    });

    it("Should unpause successfully", async function () {
      await vaultManager.connect(owner).pause();
      await vaultManager.connect(owner).unpause();
      expect(await vaultManager.isPaused()).to.equal(false);

      await vaultManager.connect(funder).fundVault(FUND_AMOUNT);
      expect(await vaultManager.vaultBalance()).to.equal(FUND_AMOUNT);
    });

    it("Should revert when non-owner calls pause", async function () {
      await expect(vaultManager.connect(addr1).pause())
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });

    it("Should revert when non-owner calls unpause", async function () {
      await vaultManager.connect(owner).pause();
      await expect(vaultManager.connect(addr1).unpause())
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("getVaultBalance", function () {
    it("Should return correct balance after funding", async function () {
      await vaultManager.connect(funder).fundVault(FUND_AMOUNT);
      expect(await vaultManager.getVaultBalance()).to.equal(FUND_AMOUNT);
    });

    it("Should return zero before any funding", async function () {
      expect(await vaultManager.getVaultBalance()).to.equal(0n);
    });

    it("Should decrease after withdrawal", async function () {
      await vaultManager.connect(funder).fundVault(FUND_AMOUNT);
      await vaultManager.connect(owner).withdrawVault(addr2.address, WITHDRAW_AMOUNT);
      expect(await vaultManager.getVaultBalance()).to.equal(FUND_AMOUNT - WITHDRAW_AMOUNT);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to call all restricted functions", async function () {
      await vaultManager.connect(funder).fundVault(FUND_AMOUNT);
      await vaultManager.connect(owner).setFeeReceiver(addr2.address);
      await vaultManager.connect(owner).withdrawVault(addr2.address, WITHDRAW_AMOUNT);
      await vaultManager.connect(owner).pause();
      await vaultManager.connect(owner).unpause();
    });

    it("Should block non-owner from withdrawVault", async function () {
      await vaultManager.connect(funder).fundVault(FUND_AMOUNT);
      await expect(vaultManager.connect(addr1).withdrawVault(addr2.address, WITHDRAW_AMOUNT))
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });

    it("Should block non-owner from setFeeReceiver", async function () {
      await expect(vaultManager.connect(addr1).setFeeReceiver(addr2.address))
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });

    it("Should block non-owner from pause", async function () {
      await expect(vaultManager.connect(addr1).pause())
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });

    it("Should block non-owner from unpause", async function () {
      await vaultManager.connect(owner).pause();
      await expect(vaultManager.connect(addr1).unpause())
        .to.be.revertedWithCustomError(vaultManager, "OwnableUnauthorizedAccount");
    });
  });
});
