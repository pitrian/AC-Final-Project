import { ethers } from 'hardhat'

async function main() {
  const savingCore = await ethers.getContractAt("SavingCore", "0xD5eFf0BBF96932365123a9cE835Fb8a539dD9d8e")
  
  const planCount = await savingCore.planCount()
  console.log("Plan count:", planCount.toString())

  for (let i = 1; i <= Number(planCount); i++) {
    const plan = await savingCore.getPlan(i)
    console.log(`Plan ${i}: enabled=${plan.enabled}, apr=${plan.aprBps.toString()}, tenor=${plan.tenorDays.toString()}, min=${ethers.formatUnits(plan.minDeposit, 6)}, max=${ethers.formatUnits(plan.maxDeposit, 6)}`)
  }

  const vaultManager = await ethers.getContractAt("VaultManager", "0x669523b632A605D9688b47384E0a895B786Cb4bf")
  const vaultBalance = await vaultManager.getVaultBalance()
  console.log("\nVault balance:", ethers.formatUnits(vaultBalance, 6), "USDC")
}

main().catch(console.error)
