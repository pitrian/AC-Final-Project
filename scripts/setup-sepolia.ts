import { ethers } from 'hardhat'

async function main() {
  const savingCore = await ethers.getContractAt("SavingCore", "0xD5eFf0BBF96932365123a9cE835Fb8a539dD9d8e")
  const mockUSDC = await ethers.getContractAt("MockUSDC", "0xef2825403924aC5c245284b7e8E8c475abfFf800")
  const vaultManager = await ethers.getContractAt("VaultManager", "0x669523b632A605D9688b47384E0a895B786Cb4bf")

  console.log("Plan count:", (await savingCore.planCount()).toString())
  console.log("Owner:", await savingCore.owner())

  // Mint USDC to owner for testing
  const [owner] = await ethers.getSigners()
  console.log("\nMinting 10000 USDC to owner...")
  const mintTx = await mockUSDC.mint(owner.address, ethers.parseUnits("10000", 6))
  await mintTx.wait()
  console.log("Minted! Balance:", (await mockUSDC.balanceOf(owner.address)).toString())

  // Create plans
  console.log("\nCreating plans...")
  
  try {
    const tx1 = await savingCore.createPlan(30, 500, ethers.parseUnits("100", 6), ethers.parseUnits("10000", 6), 200)
    await tx1.wait()
    console.log("Plan 1 created:", tx1.hash)
  } catch(e: any) {
    console.log("Error creating plan 1:", e.message)
  }

  try {
    const tx2 = await savingCore.createPlan(90, 800, ethers.parseUnits("500", 6), ethers.parseUnits("50000", 6), 300)
    await tx2.wait()
    console.log("Plan 2 created:", tx2.hash)
  } catch(e: any) {
    console.log("Error creating plan 2:", e.message)
  }

  try {
    const tx3 = await savingCore.createPlan(180, 1200, ethers.parseUnits("1000", 6), ethers.parseUnits("100000", 6), 500)
    await tx3.wait()
    console.log("Plan 3 created:", tx3.hash)
  } catch(e: any) {
    console.log("Error creating plan 3:", e.message)
  }

  // Enable plans
  console.log("\nEnabling plans...")
  try {
    await (await savingCore.enablePlan(1)).wait()
    console.log("Plan 1 enabled")
  } catch(e: any) {
    console.log("Error enabling plan 1:", e.message)
  }

  try {
    await (await savingCore.enablePlan(2)).wait()
    console.log("Plan 2 enabled")
  } catch(e: any) {
    console.log("Error enabling plan 2:", e.message)
  }

  try {
    await (await savingCore.enablePlan(3)).wait()
    console.log("Plan 3 enabled")
  } catch(e: any) {
    console.log("Error enabling plan 3:", e.message)
  }

  // Fund vault
  console.log("\nFunding vault...")
  const vaultBalance = await vaultManager.getVaultBalance()
  console.log("Current vault balance:", vaultBalance.toString())
  
  if (vaultBalance < ethers.parseUnits("5000", 6)) {
    await (await mockUSDC.approve(await vaultManager.getAddress(), ethers.parseUnits("5000", 6))).wait()
    await (await vaultManager.fundVault(ethers.parseUnits("5000", 6))).wait()
    console.log("Vault funded!")
  } else {
    console.log("Vault already funded")
  }

  console.log("\nDeployment setup complete!")
}

main().catch(console.error)
