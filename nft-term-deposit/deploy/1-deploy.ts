import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("====================");
  console.log(hre.network.name);
  console.log("====================");

  console.log("Deploying MockUSDC...");
  const mockUSDC = await deploy("MockUSDC", {
    contract: "MockUSDC",
    args: [],
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("MockUSDC deployed to:", mockUSDC.address);
  console.log("Owner:", deployer);
};

func.tags = ["deploy"];
export default func;
