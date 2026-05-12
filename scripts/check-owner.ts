import { ethers } from "hardhat";

async function main() {
  const SavingCore = await ethers.getContractFactory("SavingCore");
  const savingCore = SavingCore.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  
  const owner = await savingCore.owner();
  console.log("Owner:", owner);
  
  const [account0] = await ethers.getSigners();
  console.log("Account 0:", account0.address);
  console.log("Match:", owner.toLowerCase() === account0.address.toLowerCase());
}

main();