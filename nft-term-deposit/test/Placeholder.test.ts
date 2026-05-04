import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Placeholder } from "../typechain";

describe("Placeholder", function () {
  let deployer: SignerWithAddress;
  let placeholder: Placeholder;

  const deploy = async () => {
    [deployer] = await ethers.getSigners();
    placeholder = await (await ethers.getContractFactory("Placeholder")).deploy();
  };

  before(async () => {
    console.log("Deploying Placeholder contract...");
    await deploy();
  });

  describe("Deployment", function () {
    it("Should have correct protocol name", async function () {
      expect(await placeholder.NAME()).to.equal("NFT Term Deposit Protocol");
    });

    it("Should have version 1", async function () {
      expect(await placeholder.VERSION()).to.equal(1n);
    });

    it("Should return correct protocol info", async function () {
      const info = await placeholder.getProtocolInfo();
      expect(info.name).to.equal("NFT Term Deposit Protocol");
      expect(info.version).to.equal(1n);
    });
  });
});
