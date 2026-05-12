import { ethers } from "hardhat";

async function main() {
  const savingCore = await ethers.getContractAt(
    "SavingCore",
    "0x0ab1d1C38AAcCFf1BB03f163fC455EE9C65aE299"
  );
  
  console.log("Enabling plans...");
  await savingCore.enablePlan(1);
  console.log("Enabled plan 1");
  await savingCore.enablePlan(2);
  console.log("Enabled plan 2");
  await savingCore.enablePlan(3);
  console.log("Enabled plan 3");
  
  console.log("\nNew addresses for frontend:");
  console.log(`SavingCore: 0x0ab1d1C38AAcCFf1BB03f163fC455EE9C65aE299`);
  console.log(`MockUSDC: 0x53ccC157aFD00C5280aBB3b5fC3Abf0E733880cb`);
  console.log(`VaultManager: 0x242635740627E43d43d7Dfa3310e238737415257`);
}

main().catch(console.error);