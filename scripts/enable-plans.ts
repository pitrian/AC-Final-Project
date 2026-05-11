import { ethers } from "hardhat";

async function main() {
  const savingCore = await ethers.getContractAt(
    "SavingCore",
    "0xed183dB08DAA20907fB2D55dfeA0f719eDf0f020"
  );
  
  console.log("Checking plans...");
  for (let i = 1; i <= 3; i++) {
    try {
      const plan = await savingCore.getPlan(i);
      console.log(`Plan ${i}:`, plan);
    } catch (e) {
      console.log(`Plan ${i} error:`, e.message);
    }
  }
  
  console.log("\nEnabling plans...");
  try {
    await savingCore.enablePlan(1);
    console.log("Enabled plan 1");
  } catch (e) {
    console.log("Enable plan 1 error:", e.message);
  }
  
  try {
    await savingCore.enablePlan(2);
    console.log("Enabled plan 2");
  } catch (e) {
    console.log("Enable plan 2 error:", e.message);
  }
  
  try {
    await savingCore.enablePlan(3);
    console.log("Enabled plan 3");
  } catch (e) {
    console.log("Enable plan 3 error:", e.message);
  }
}

main().catch(console.error);