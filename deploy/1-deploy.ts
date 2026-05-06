import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("====================");
  console.log(hre.network.name);
  console.log("====================");

  // Phase 2: Deploy MockUSDC
  console.log("Deploying MockUSDC...");
  const mockUSDC = await deploy("MockUSDC", {
    contract: "MockUSDC",
    args: [],
    from: deployer,
    log: true,
    autoMine: true,
  });
  console.log("MockUSDC deployed to:", mockUSDC.address);

  // Phase 3: Deploy VaultManager
  const feeReceiver = deployer;
  console.log("Deploying VaultManager...");
  const vaultManager = await deploy("VaultManager", {
    contract: "VaultManager",
    args: [mockUSDC.address, feeReceiver],
    from: deployer,
    log: true,
    autoMine: true,
  });
  console.log("VaultManager deployed to:", vaultManager.address);

  // Phase 4: Deploy SavingCore
  console.log("Deploying SavingCore...");
  const savingCore = await deploy("SavingCore", {
    contract: "SavingCore",
    args: [mockUSDC.address, vaultManager.address, feeReceiver],
    from: deployer,
    log: true,
    autoMine: true,
  });
  console.log("SavingCore deployed to:", savingCore.address);

  // Post-deployment setup
  console.log("Setting up approvals...");
  const MockUSDC = await ethers.getContractAt("MockUSDC", mockUSDC.address);
  const VaultManager = await ethers.getContractAt("VaultManager", vaultManager.address);
  await MockUSDC.approve(vaultManager.address, ethers.MaxUint256);
  await VaultManager.approveSpender(savingCore.address, ethers.MaxUint256);

  console.log("Deployment complete!");
};

func.tags = ["deploy"];
export default func;
