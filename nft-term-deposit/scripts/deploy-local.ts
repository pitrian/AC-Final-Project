import { ethers } from 'hardhat'

async function main() {
  console.log('Deploying contracts on localhost...')

  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)

  const MockUSDC = await ethers.getContractFactory('MockUSDC')
  const mockUSDC = await MockUSDC.deploy()
  await mockUSDC.waitForDeployment()
  console.log('MockUSDC deployed to:', await mockUSDC.getAddress())

  const VaultManager = await ethers.getContractFactory('VaultManager')
  const vaultManager = await VaultManager.deploy(await mockUSDC.getAddress(), deployer.address)
  await vaultManager.waitForDeployment()
  console.log('VaultManager deployed to:', await vaultManager.getAddress())

  const SavingCore = await ethers.getContractFactory('SavingCore')
  const savingCore = await SavingCore.deploy(
    await mockUSDC.getAddress(),
    await vaultManager.getAddress(),
    deployer.address
  )
  await savingCore.waitForDeployment()
  console.log('SavingCore deployed to:', await savingCore.getAddress())

  console.log('\nSetting up approvals...')
  const MockUSDCContract = await ethers.getContractAt('MockUSDC', await mockUSDC.getAddress())
  const VaultManagerContract = await ethers.getContractAt('VaultManager', await vaultManager.getAddress())

  await MockUSDCContract.approve(await vaultManager.getAddress(), ethers.MaxUint256)
  console.log('MockUSDC -> VaultManager approved')

  await VaultManagerContract.approveSpender(await savingCore.getAddress(), ethers.MaxUint256)
  console.log('VaultManager -> SavingCore approved')

  console.log('\nMinting 10000 USDC to deployer...')
  await MockUSDCContract.mint(deployer.address, ethers.parseUnits('10000', 6))
  console.log('Balance:', await MockUSDCContract.balanceOf(deployer.address))

  console.log('\nCreating plans...')
  await savingCore.createPlan(30, 500, ethers.parseUnits('100', 6), ethers.parseUnits('10000', 6), 200)
  await savingCore.createPlan(90, 800, ethers.parseUnits('500', 6), ethers.parseUnits('50000', 6), 300)
  await savingCore.createPlan(180, 1200, ethers.parseUnits('1000', 6), ethers.parseUnits('100000', 6), 500)
  await savingCore.enablePlan(1)
  await savingCore.enablePlan(2)
  await savingCore.enablePlan(3)
  console.log('Plans created and enabled')

  console.log('\nFunding vault with 5000 USDC...')
  await MockUSDCContract.approve(await vaultManager.getAddress(), ethers.parseUnits('5000', 6))
  await VaultManagerContract.fundVault(ethers.parseUnits('5000', 6))
  console.log('Vault funded')

  console.log('\n====================')
  console.log('Frontend .env:')
  console.log(`VITE_SAVING_CORE_ADDRESS=${await savingCore.getAddress()}`)
  console.log(`VITE_MOCK_USDC_ADDRESS=${await mockUSDC.getAddress()}`)
  console.log(`VITE_VAULT_MANAGER_ADDRESS=${await vaultManager.getAddress()}`)
  console.log('====================')

  console.log('\nDeployment complete!')
}

main().catch(console.error)
