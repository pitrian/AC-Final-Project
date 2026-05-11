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
    savingCore: '0x37C37d9F0d4feD8c5e8A64abE0CE3Af3aA958498',
    mockUSDC: '0x22C031d5AcEBf03Ac1Fb13fB7648d5D4790b6bcC',
    vaultManager: '0x9505436218561d22036603f7F03526509f542C38',
  },
}

export function getNetworkConfig(chainId: number): NetworkConfig | null {
  return NETWORKS[chainId] || null
}