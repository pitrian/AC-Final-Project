import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("====================");
  console.log(hre.network.name);
  console.log("====================");

  // Deployments will be added as contracts are implemented
  // Phase 2: MockUSDC
  // Phase 3: VaultManager
  // Phase 4: SavingCore

  console.log("No contracts to deploy yet. Phase 1 complete.");
};

func.tags = ["deploy"];
export default func;
