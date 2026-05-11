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
    savingCore: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    mockUSDC: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    vaultManager: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    savingCore: '0xed183dB08DAA20907fB2D55dfeA0f719eDf0f020',
    mockUSDC: '0x9fD27aA483f528e9DA228E6C0D97Fcaa1035bBAb',
    vaultManager: '0xFA9B1e5Cb087C1f23015dF3913A3881D07E0FC30',
  },
}

export function getNetworkConfig(chainId: number): NetworkConfig | null {
  return NETWORKS[chainId] || null
}