import { useState, useCallback, useEffect } from 'react'
import { BrowserProvider, formatEther } from 'ethers'
import type { WalletState } from '../types'

declare global {
  interface Window {
    ethereum?: any
  }
}

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
  })

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!')
      return
    }

    setWallet(prev => ({ ...prev, isConnecting: true }))

    try {
      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = accounts[0]
      const ethBalance = await provider.getBalance(address)

      const balance = parseFloat(formatEther(ethBalance)).toFixed(4)

      setWallet({
        address,
        signer,
        provider,
        balance,
        usdcBalance: '0',
        isConnected: true,
        isConnecting: false,
      })
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      setWallet(prev => ({ ...prev, isConnecting: false }))
    }
  }, [])

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      signer: null,
      provider: null,
      balance: '0',
      usdcBalance: '0',
      isConnected: false,
      isConnecting: false,
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
