import { Eip1193Provider, formatEther } from 'ethers'

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}
