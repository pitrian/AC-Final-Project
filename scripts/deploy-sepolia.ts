import { ethers } from 'hardhat'

async function main() {
  console.log('Deploying contracts to Sepolia...')

  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Balance:', ethers.formatEther(balance), 'ETH')

  if (balance < ethers.parseEther('0.01')) {
    console.error('Insufficient balance! Please get Sepolia ETH from faucet')
    return
  }

  // Deploy MockUSDC
  console.log('\nDeploying MockUSDC...')
  const MockUSDC = await ethers.getContractFactory('MockUSDC')
  const mockUSDC = await MockUSDC.deploy()
  await mockUSDC.waitForDeployment()
  console.log('MockUSDC deployed to:', await mockUSDC.getAddress())

  // Deploy VaultManager
  console.log('\nDeploying VaultManager...')
  const VaultManager = await ethers.getContractFactory('VaultManager')
  const vaultManager = await VaultManager.deploy(await mockUSDC.getAddress(), deployer.address)
  await vaultManager.waitForDeployment()
  console.log('VaultManager deployed to:', await vaultManager.getAddress())

  // Deploy SavingCore
  console.log('\nDeploying SavingCore...')
  const SavingCore = await ethers.getContractFactory('SavingCore')
  const savingCore = await SavingCore.deploy(
    await mockUSDC.getAddress(),
    await vaultManager.getAddress(),
    deployer.address
  )
  await savingCore.waitForDeployment()
  console.log('SavingCore deployed to:', await savingCore.getAddress())

  // Setup approvals
  console.log('\nSetting up approvals...')
  const MockUSDCContract = await ethers.getContractAt('MockUSDC', await mockUSDC.getAddress())
  const VaultManagerContract = await ethers.getContractAt('VaultManager', await vaultManager.getAddress())

  await MockUSDCContract.approve(await vaultManager.getAddress(), ethers.MaxUint256)
  console.log('MockUSDC -> VaultManager approved')

  await VaultManagerContract.approveSpender(await savingCore.getAddress(), ethers.MaxUint256)
  console.log('VaultManager -> SavingCore approved')

  // Create plans
  console.log('\nCreating plans...')
  await savingCore.createPlan(30, 500, ethers.parseUnits('100', 6), ethers.parseUnits('10000', 6), 200)
  await savingCore.createPlan(90, 800, ethers.parseUnits('500', 6), ethers.parseUnits('50000', 6), 300)
  await savingCore.createPlan(180, 1200, ethers.parseUnits('1000', 6), ethers.parseUnits('100000', 6), 500)
  await savingCore.enablePlan(1)
  await savingCore.enablePlan(2)
  await savingCore.enablePlan(3)
  console.log('Plans created and enabled')

  // Output frontend .env
  console.log('\n====================')
  console.log('Frontend .env:')
  console.log(`VITE_SAVING_CORE_ADDRESS=${await savingCore.getAddress()}`)
  console.log(`VITE_MOCK_USDC_ADDRESS=${await mockUSDC.getAddress()}`)
  console.log(`VITE_VAULT_MANAGER_ADDRESS=${await vaultManager.getAddress()}`)
  console.log(`VITE_CHAIN_ID=11155111`)
  console.log(`VITE_NETWORK_NAME=Sepolia Testnet`)
  console.log('====================')

  console.log('\nDeployment complete!')
}

main().catch(console.error)
