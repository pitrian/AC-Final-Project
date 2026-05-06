import { useState, useCallback, useEffect } from 'react'
import { BrowserProvider, formatEther } from 'ethers'
import type { WalletState } from '../types'

declare global {
  interface Window {
    ethereum?: any
  }
}

const SEPOLIA_RPC = 'https://eth-sepolia.g.alchemy.com/v2/o7K3LHjW01rjqTPDH5USU'
const SEPOLIA_CHAIN_ID = 11155111 // 0xaa36a7
const LOCALHOST_CHAIN_ID = 31337

export function useWallet(): WalletState & {
  connect: () => Promise<void>
  disconnect: () => void
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

  const switchToNetwork = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return false
    
    const targetHex = '0x' + targetChainId.toString(16)
    
    try {
      // Try to switch to target network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      })
      return true
    } catch (switchError: any) {
      // If network not added yet, add it
      if (switchError.code === 4902) {
        try {
          const isSepolia = targetChainId === 11155111
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
      // First, detect current network
      const tempProvider = new BrowserProvider(window.ethereum)
      const network = await tempProvider.getNetwork()
      const currentChainId = Number(network.chainId)
      
      console.log('[useWallet] Current network:', { chainId: currentChainId, name: network.name })
      
      // If on Localhost, stay there; otherwise switch to Sepolia
      if (currentChainId !== LOCALHOST_CHAIN_ID) {
        console.log('[useWallet] Not on Localhost, switching to Sepolia...')
        const switched = await switchToNetwork(SEPOLIA_CHAIN_ID)
        if (!switched) {
          throw new Error('Failed to switch to Sepolia network')
        }
        // After switching, create new provider
        const newProvider = new BrowserProvider(window.ethereum)
        const accounts = await newProvider.send('eth_requestAccounts', [])
        const signer = await newProvider.getSigner()
        const address = accounts[0]
        const ethBalance = await newProvider.getBalance(address)
        const newNetwork = await newProvider.getNetwork()

        const balance = parseFloat(formatEther(ethBalance)).toFixed(4)
        console.log('[useWallet] Connected to Sepolia:', { address, balance, chainId: Number(newNetwork.chainId) })

        setWallet({
          address,
          signer,
          provider: newProvider,
          balance,
          usdcBalance: '0',
          isConnected: true,
          isConnecting: false,
          chainId: Number(newNetwork.chainId),
        })
      } else {
        // Already on Localhost, just connect
        console.log('[useWallet] Already on Localhost, connecting...')
        const accounts = await tempProvider.send('eth_requestAccounts', [])
        const signer = await tempProvider.getSigner()
        const address = accounts[0]
        const ethBalance = await tempProvider.getBalance(address)

        const balance = parseFloat(formatEther(ethBalance)).toFixed(4)
        console.log('[useWallet] Connected to Localhost:', { address, balance, chainId: currentChainId })

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
      }
    } catch (err) {
      console.error('[useWallet] Failed to connect wallet:', err)
      setWallet(prev => ({ ...prev, isConnecting: false }))
    }
  }, [switchToNetwork])

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

  return { ...wallet, connect, disconnect }
}
