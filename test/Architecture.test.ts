import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Architecture Verification", function () {
  describe("Interfaces", function () {
    it("Should have IERC20 interface artifact", async function () {
      const artifact = await hre.artifacts.readArtifact("contracts/interfaces/IERC20.sol:IERC20");
      expect(artifact.abi.length).to.be.greaterThan(0);
    });

    it("Should have IERC721 interface artifact", async function () {
      const artifact = await hre.artifacts.readArtifact("contracts/interfaces/IERC721.sol:IERC721");
      expect(artifact.abi.length).to.be.greaterThan(0);
    });

    it("Should have IVaultManager interface artifact", async function () {
      const artifact = await hre.artifacts.readArtifact("contracts/interfaces/IVaultManager.sol:IVaultManager");
      expect(artifact.abi.length).to.be.greaterThan(0);
      expect(artifact.abi.find((item: any) => item.type === "event" && item.name === "VaultFunded")).to.not.be.undefined;
    });

    it("Should have ISavingCore interface artifact", async function () {
      const artifact = await hre.artifacts.readArtifact("contracts/interfaces/ISavingCore.sol:ISavingCore");
      expect(artifact.abi.length).to.be.greaterThan(0);
      expect(artifact.abi.find((item: any) => item.type === "event" && item.name === "PlanCreated")).to.not.be.undefined;
      expect(artifact.abi.find((item: any) => item.type === "event" && item.name === "DepositOpened")).to.not.be.undefined;
    });
  });
});
