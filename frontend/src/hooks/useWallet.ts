import { useState, useCallback, useEffect } from 'react'
import { BrowserProvider, formatEther } from 'ethers'
import type { WalletState } from '../types'

declare global {
  interface Window {
    ethereum?: any
  }
}

const SEPOLIA_RPC = 'https://eth-sepolia.g.alchemy.com/v2/o7K3LHjW01rjqTPDH5USU'
const SEPOLIA_CHAIN_ID = 11155111

export function useWallet(): WalletState & {
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<boolean>
} {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    signer: null,
    provider: null,
    balance: '0',
    usdcBalance: '0',
    isConnected: false,
    isConnecting: false,
    chainId: null,
  })

  const switchNetwork = useCallback(async (targetChainId: number): Promise<boolean> => {
    if (!window.ethereum) return false
    
    const targetHex = '0x' + targetChainId.toString(16)
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      })
      return true
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          const isSepolia = targetChainId === SEPOLIA_CHAIN_ID
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetHex,
              chainName: isSepolia ? 'Sepolia Testnet' : 'Localhost 8545',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: isSepolia ? [SEPOLIA_RPC] : ['http://127.0.0.1:8545'],
              blockExplorerUrls: isSepolia ? ['https://sepolia.etherscan.io'] : [],
            }],
          })
          return true
        } catch (addError) {
          console.error('[useWallet] Failed to add network:', addError)
          return false
        }
      }
      console.error('[useWallet] Failed to switch network:', switchError)
      return false
    }
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!')
      return
    }

    console.log('[useWallet] Connect clicked, checking MetaMask...')
    setWallet(prev => ({ ...prev, isConnecting: true }))

    try {
      const tempProvider = new BrowserProvider(window.ethereum)
      const network = await tempProvider.getNetwork()
      const currentChainId = Number(network.chainId)
      
      console.log('[useWallet] Current network:', { chainId: currentChainId, name: network.name })

      // Just connect to whatever network MetaMask is currently on
      const accounts = await tempProvider.send('eth_requestAccounts', [])
      const signer = await tempProvider.getSigner()
      const address = accounts[0]
      const ethBalance = await tempProvider.getBalance(address)

      const balance = parseFloat(formatEther(ethBalance)).toFixed(4)
      console.log('[useWallet] Connected to chain:', { address, balance, chainId: currentChainId })

      setWallet({
        address,
        signer,
        provider: tempProvider,
        balance,
        usdcBalance: '0',
        isConnected: true,
        isConnecting: false,
        chainId: currentChainId,
      })
    } catch (err) {
      console.error('[useWallet] Failed to connect wallet:', err)
      setWallet(prev => ({ ...prev, isConnecting: false }))
    }
  }, [])

  const disconnect = useCallback(() => {
    console.log('[useWallet] Disconnecting...')
    setWallet({
      address: null,
      signer: null,
      provider: null,
      balance: '0',
      usdcBalance: '0',
      isConnected: false,
      isConnecting: false,
      chainId: null,
    })
  }, [])

  useEffect(() => {
    if (wallet.isConnected && window.ethereum) {
      window.ethereum.on('accountsChanged', () => disconnect())
      window.ethereum.on('chainChanged', () => disconnect())
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', disconnect)
        window.ethereum.removeListener('chainChanged', disconnect)
      }
    }
  }, [wallet.isConnected, disconnect])

  return { ...wallet, connect, disconnect, switchNetwork }
}