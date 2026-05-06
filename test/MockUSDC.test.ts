import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MockUSDC } from "../typechain";

describe("MockUSDC", function () {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let mockUSDC: MockUSDC;

  const MINT_AMOUNT = 1_000_000_000_000n; // 1,000,000 USDC (6 decimals)
  const TRANSFER_AMOUNT = 100_000_000n; // 100 USDC

  beforeEach(async () => {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have correct name", async function () {
      expect(await mockUSDC.name()).to.equal("Mock USD Coin");
    });

    it("Should have correct symbol", async function () {
      expect(await mockUSDC.symbol()).to.equal("mUSDC");
    });

    it("Should have 6 decimals", async function () {
      expect(await mockUSDC.decimals()).to.equal(6n);
    });

    it("Should have zero initial supply", async function () {
      expect(await mockUSDC.totalSupply()).to.equal(0n);
    });

    it("Should set deployer as owner", async function () {
      expect(await mockUSDC.owner()).to.equal(owner.address);
    });
  });

  describe("Mint", function () {
    it("Should mint tokens to an address", async function () {
      await mockUSDC.mint(addr1.address, MINT_AMOUNT);
      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(MINT_AMOUNT);
    });

    it("Should increase total supply after mint", async function () {
      await mockUSDC.mint(addr1.address, MINT_AMOUNT);
      expect(await mockUSDC.totalSupply()).to.equal(MINT_AMOUNT);
    });

    it("Should mint to multiple accounts", async function () {
      await mockUSDC.mint(addr1.address, MINT_AMOUNT);
      await mockUSDC.mint(addr2.address, MINT_AMOUNT);
      await mockUSDC.mint(addr3.address, MINT_AMOUNT);

      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(MINT_AMOUNT);
      expect(await mockUSDC.balanceOf(addr2.address)).to.equal(MINT_AMOUNT);
      expect(await mockUSDC.balanceOf(addr3.address)).to.equal(MINT_AMOUNT);
      expect(await mockUSDC.totalSupply()).to.equal(MINT_AMOUNT * 3n);
    });

    it("Should emit Minted event", async function () {
      await expect(mockUSDC.mint(addr1.address, MINT_AMOUNT))
        .to.emit(mockUSDC, "Minted")
        .withArgs(addr1.address, MINT_AMOUNT);
    });

    it("Should revert when minting to zero address", async function () {
      await expect(mockUSDC.mint(ethers.ZeroAddress, MINT_AMOUNT))
        .to.be.revertedWithCustomError(mockUSDC, "MintToZeroAddress");
    });

    it("Should revert when minting zero amount", async function () {
      await expect(mockUSDC.mint(addr1.address, 0n))
        .to.be.revertedWithCustomError(mockUSDC, "MintZeroAmount");
    });

    it("Should revert when non-owner tries to mint", async function () {
      await expect(mockUSDC.connect(addr1).mint(addr1.address, MINT_AMOUNT))
        .to.be.revertedWithCustomError(mockUSDC, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfer", function () {
    beforeEach(async function () {
      await mockUSDC.mint(addr1.address, MINT_AMOUNT);
    });

    it("Should transfer tokens between accounts", async function () {
      await mockUSDC.connect(addr1).transfer(addr2.address, TRANSFER_AMOUNT);

      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(MINT_AMOUNT - TRANSFER_AMOUNT);
      expect(await mockUSDC.balanceOf(addr2.address)).to.equal(TRANSFER_AMOUNT);
    });

    it("Should not change total supply after transfer", async function () {
      await mockUSDC.connect(addr1).transfer(addr2.address, TRANSFER_AMOUNT);
      expect(await mockUSDC.totalSupply()).to.equal(MINT_AMOUNT);
    });

    it("Should emit Transfer event", async function () {
      await expect(mockUSDC.connect(addr1).transfer(addr2.address, TRANSFER_AMOUNT))
        .to.emit(mockUSDC, "Transfer")
        .withArgs(addr1.address, addr2.address, TRANSFER_AMOUNT);
    });

    it("Should revert when transferring more than balance", async function () {
      await expect(mockUSDC.connect(addr1).transfer(addr2.address, MINT_AMOUNT + 1n))
        .to.be.revertedWithCustomError(mockUSDC, "ERC20InsufficientBalance");
    });

    it("Should revert when transferring to zero address", async function () {
      await expect(mockUSDC.connect(addr1).transfer(ethers.ZeroAddress, TRANSFER_AMOUNT))
        .to.be.revertedWithCustomError(mockUSDC, "ERC20InvalidReceiver");
    });

    it("Should handle transferring entire balance", async function () {
      await mockUSDC.connect(addr1).transfer(addr2.address, MINT_AMOUNT);
      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(0n);
      expect(await mockUSDC.balanceOf(addr2.address)).to.equal(MINT_AMOUNT);
    });
  });

  describe("Approve & TransferFrom", function () {
    beforeEach(async function () {
      await mockUSDC.mint(addr1.address, MINT_AMOUNT);
    });

    it("Should approve spending", async function () {
      await mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT);
      expect(await mockUSDC.allowance(addr1.address, addr2.address)).to.equal(TRANSFER_AMOUNT);
    });

    it("Should emit Approval event", async function () {
      await expect(mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT))
        .to.emit(mockUSDC, "Approval")
        .withArgs(addr1.address, addr2.address, TRANSFER_AMOUNT);
    });

    it("Should transferFrom after approval", async function () {
      await mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT);

      await mockUSDC.connect(addr2).transferFrom(addr1.address, addr3.address, TRANSFER_AMOUNT);

      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(MINT_AMOUNT - TRANSFER_AMOUNT);
      expect(await mockUSDC.balanceOf(addr3.address)).to.equal(TRANSFER_AMOUNT);
      expect(await mockUSDC.allowance(addr1.address, addr2.address)).to.equal(0n);
    });

    it("Should emit Transfer event on transferFrom", async function () {
      await mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT);

      await expect(mockUSDC.connect(addr2).transferFrom(addr1.address, addr3.address, TRANSFER_AMOUNT))
        .to.emit(mockUSDC, "Transfer")
        .withArgs(addr1.address, addr3.address, TRANSFER_AMOUNT);
    });

    it("Should revert transferFrom without approval", async function () {
      await expect(mockUSDC.connect(addr2).transferFrom(addr1.address, addr3.address, TRANSFER_AMOUNT))
        .to.be.revertedWithCustomError(mockUSDC, "ERC20InsufficientAllowance");
    });

    it("Should revert transferFrom exceeding allowance", async function () {
      await mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT);

      await expect(mockUSDC.connect(addr2).transferFrom(addr1.address, addr3.address, TRANSFER_AMOUNT + 1n))
        .to.be.revertedWithCustomError(mockUSDC, "ERC20InsufficientAllowance");
    });

    it("Should allow multiple transferFrom within allowance", async function () {
      const halfAmount = TRANSFER_AMOUNT / 2n;
      await mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT);

      await mockUSDC.connect(addr2).transferFrom(addr1.address, addr3.address, halfAmount);
      expect(await mockUSDC.allowance(addr1.address, addr2.address)).to.equal(halfAmount);

      await mockUSDC.connect(addr2).transferFrom(addr1.address, addr3.address, halfAmount);
      expect(await mockUSDC.allowance(addr1.address, addr2.address)).to.equal(0n);
    });
  });

  describe("Burn", function () {
    beforeEach(async function () {
      await mockUSDC.mint(addr1.address, MINT_AMOUNT);
    });

    it("Should burn tokens from caller", async function () {
      const balanceBefore = await mockUSDC.balanceOf(addr1.address);
      const supplyBefore = await mockUSDC.totalSupply();

      await mockUSDC.connect(addr1).burn(TRANSFER_AMOUNT);

      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(balanceBefore - TRANSFER_AMOUNT);
      expect(await mockUSDC.totalSupply()).to.equal(supplyBefore - TRANSFER_AMOUNT);
    });

    it("Should emit Burned event", async function () {
      await expect(mockUSDC.connect(addr1).burn(TRANSFER_AMOUNT))
        .to.emit(mockUSDC, "Burned")
        .withArgs(addr1.address, TRANSFER_AMOUNT);
    });

    it("Should revert when burning zero amount", async function () {
      await expect(mockUSDC.connect(addr1).burn(0n))
        .to.be.revertedWithCustomError(mockUSDC, "BurnZeroAmount");
    });

    it("Should revert when burning more than balance", async function () {
      await expect(mockUSDC.connect(addr1).burn(MINT_AMOUNT + 1n))
        .to.be.revertedWithCustomError(mockUSDC, "InsufficientBalance");
    });

    it("Should burn entire balance", async function () {
      await mockUSDC.connect(addr1).burn(MINT_AMOUNT);
      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(0n);
      expect(await mockUSDC.totalSupply()).to.equal(0n);
    });

    describe("burnFrom", function () {
      it("Should burnFrom with approval", async function () {
        await mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT);

        const balanceBefore = await mockUSDC.balanceOf(addr1.address);
        const supplyBefore = await mockUSDC.totalSupply();

        await mockUSDC.connect(addr2).burnFrom(addr1.address, TRANSFER_AMOUNT);

        expect(await mockUSDC.balanceOf(addr1.address)).to.equal(balanceBefore - TRANSFER_AMOUNT);
        expect(await mockUSDC.totalSupply()).to.equal(supplyBefore - TRANSFER_AMOUNT);
        expect(await mockUSDC.allowance(addr1.address, addr2.address)).to.equal(0n);
      });

      it("Should emit Burned event on burnFrom", async function () {
        await mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT);

        await expect(mockUSDC.connect(addr2).burnFrom(addr1.address, TRANSFER_AMOUNT))
          .to.emit(mockUSDC, "Burned")
          .withArgs(addr1.address, TRANSFER_AMOUNT);
      });

      it("Should revert burnFrom without approval", async function () {
        await expect(mockUSDC.connect(addr2).burnFrom(addr1.address, TRANSFER_AMOUNT))
          .to.be.revertedWithCustomError(mockUSDC, "ERC20InsufficientAllowance");
      });

      it("Should revert burnFrom exceeding allowance", async function () {
        await mockUSDC.connect(addr1).approve(addr2.address, TRANSFER_AMOUNT);

        await expect(mockUSDC.connect(addr2).burnFrom(addr1.address, TRANSFER_AMOUNT + 1n))
          .to.be.revertedWithCustomError(mockUSDC, "ERC20InsufficientAllowance");
      });
    });
  });

  describe("Edge Cases", function () {
    it("Should handle large amounts correctly", async function () {
      const largeAmount = 1_000_000_000_000_000n; // 1 billion USDC
      await mockUSDC.mint(addr1.address, largeAmount);
      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(largeAmount);
    });

    it("Should handle zero value transfer", async function () {
      await mockUSDC.mint(addr1.address, MINT_AMOUNT);
      await mockUSDC.connect(addr1).transfer(addr2.address, 0n);
      expect(await mockUSDC.balanceOf(addr2.address)).to.equal(0n);
    });

    it("Should handle self-transfer", async function () {
      await mockUSDC.mint(addr1.address, MINT_AMOUNT);
      await mockUSDC.connect(addr1).transfer(addr1.address, TRANSFER_AMOUNT);
      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(MINT_AMOUNT);
    });

    it("Should handle self-approve", async function () {
      await mockUSDC.connect(addr1).approve(addr1.address, TRANSFER_AMOUNT);
      expect(await mockUSDC.allowance(addr1.address, addr1.address)).to.equal(TRANSFER_AMOUNT);
    });

    it("Should return correct 6 decimal precision", async function () {
      const oneUSDC = 1_000_000n;
      await mockUSDC.mint(addr1.address, oneUSDC);
      expect(await mockUSDC.balanceOf(addr1.address)).to.equal(oneUSDC);
    });
  });
});
