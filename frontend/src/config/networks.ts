export interface NetworkConfig {
  chainId: number
  name: string
  savingCore: string
  mockUSDC: string
  vaultManager: string
}

export const NETWORKS: Record<number, NetworkConfig> = {
  31337: {
    chainId: 31337,
    name: 'Localhost 8545',
    savingCore: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    mockUSDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    vaultManager: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    savingCore: '0x0ab1d1C38AAcCFf1BB03f163fC455EE9C65aE299',
    mockUSDC: '0x53ccC157aFD00C5280aBB3b5fC3Abf0E733880cb',
    vaultManager: '0x242635740627E43d43d7Dfa3310e238737415257',
  },
}

export function getNetworkConfig(chainId: number): NetworkConfig | null {
  return NETWORKS[chainId] || null
}