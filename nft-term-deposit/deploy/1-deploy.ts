import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

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
  console.log("Fee receiver:", feeReceiver);
};

func.tags = ["deploy"];
export default func;
