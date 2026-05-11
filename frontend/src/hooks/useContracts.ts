import { useState, useCallback, useEffect } from 'react'
import { Contract, formatUnits, parseUnits, JsonRpcSigner, BrowserProvider } from 'ethers'
import { SavingCoreABI, MockUSDCABI, VaultManagerABI } from '../contracts/abis'
import type { SavingPlan, DepositInfo } from '../types'
import { getNetworkConfig } from '../config/networks'

export function useContracts(signer: JsonRpcSigner | null, provider: BrowserProvider | null, chainId: number | null) {
  const [plans, setPlans] = useState<SavingPlan[]>([])
  const [userDeposits, setUserDeposits] = useState<(DepositInfo & { depositId: number })[]>([])
  const [usdcBalance, setUsdcBalance] = useState<string>('0')
  const [owner, setOwner] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockTimestamp, setBlockTimestamp] = useState<number>(Math.floor(Date.now() / 1000))
  const [networkError, setNetworkError] = useState<string | null>(null)

  const fetchBlockTimestamp = useCallback(async () => {
    if (!provider) return
    try {
      const block = await provider.getBlock('latest')
      if (block) setBlockTimestamp(block.timestamp)
    } catch (err) {
      console.error('Failed to fetch block timestamp:', err)
    }
  }, [provider])

  const getContracts = useCallback(() => {
    if (!signer || !chainId) return null
    
    const networkConfig = getNetworkConfig(chainId)
    if (!networkConfig) {
      setNetworkError(`Unsupported network: chainId ${chainId}. Only Localhost (31337) and Sepolia (11155111) are supported.`)
      return null
    }
    
    setNetworkError(null)
    return {
      savingCore: new Contract(networkConfig.savingCore, SavingCoreABI, signer),
      mockUSDC: new Contract(networkConfig.mockUSDC, MockUSDCABI, signer),
      vaultManager: new Contract(networkConfig.vaultManager, VaultManagerABI, signer),
    }
  }, [signer, chainId])

  useEffect(() => {
    if (signer) {
      const loadOwner = async () => {
        try {
          const contracts = getContracts()
          if (!contracts) return
          const ownerAddress = await contracts.savingCore.owner()
          setOwner(ownerAddress.toLowerCase())
        } catch (err) {
          console.error('Failed to load owner:', err)
        }
      }
      loadOwner()
    } else {
      setOwner(null)
    }
  }, [signer, getContracts])

  const isOwner = useCallback(async (address: string) => {
    if (!signer) return false
    try {
      const contracts = getContracts()
      if (!contracts) return false
      const ownerAddress = await contracts.savingCore.owner()
      return ownerAddress.toLowerCase() === address.toLowerCase()
    } catch {
      return false
    }
  }, [signer, getContracts])

  const loadPlans = useCallback(async () => {
    if (!signer) return
    try {
      const contracts = getContracts()
      if (!contracts) return

      const planCount: bigint = await contracts.savingCore.planCount()
      const loadedPlans: SavingPlan[] = []

      for (let i = 1; i <= Number(planCount); i++) {
        const plan = await contracts.savingCore.getPlan(i)
        loadedPlans.push({
          planId: BigInt(i),
          tenorDays: plan.tenorDays,
          aprBps: plan.aprBps,
          minDeposit: plan.minDeposit,
          maxDeposit: plan.maxDeposit,
          penaltyBps: plan.penaltyBps,
          enabled: plan.enabled,
        })
      }
      setPlans(loadedPlans)
    } catch (err: any) {
      setError('Failed to load plans: ' + err.message)
    }
  }, [signer, getContracts])

  const loadUsdcBalance = useCallback(async (address: string) => {
    if (!signer) return
    try {
      const contracts = getContracts()
      if (!contracts) return
      const balance: bigint = await contracts.mockUSDC.balanceOf(address)
      setUsdcBalance(formatUnits(balance, 6))
    } catch (err: any) {
      console.error('Failed to load USDC balance:', err)
    }
  }, [signer, getContracts])

  const loadUserDeposits = useCallback(async (address: string) => {
    if (!signer || !provider) return
    try {
      const contracts = getContracts()
      if (!contracts) return

      const depositCount: bigint = await contracts.savingCore.depositCount()
      const deposits: (DepositInfo & { depositId: number })[] = []

      for (let i = 1; i <= Number(depositCount); i++) {
        const deposit = await contracts.savingCore.getDeposit(i)
        if (deposit.owner.toLowerCase() === address.toLowerCase() && Number(deposit.status) !== 1) {
          deposits.push({
            depositId: i,
            owner: deposit.owner,
            planId: deposit.planId,
            principal: deposit.principal,
            maturityAt: deposit.maturityAt,
            aprBpsAtOpen: deposit.aprBpsAtOpen,
            penaltyBpsAtOpen: deposit.penaltyBpsAtOpen,
            status: Number(deposit.status),
          })
        }
      }
      setUserDeposits(deposits)
    } catch (err: any) {
      setError('Failed to load deposits: ' + err.message)
    }
  }, [signer, provider, getContracts])

  const openDeposit = useCallback(async (planId: number, amount: string) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const amountWei = parseUnits(amount, 6)
      const address = await signer.getAddress()
      const currentBalance: bigint = await contracts.mockUSDC.balanceOf(address)
      if (currentBalance < amountWei) {
        throw new Error('Insufficient USDC balance')
      }

      const networkConfig = getNetworkConfig(chainId!)
      if (!networkConfig) throw new Error('Unsupported network')
      
      const approveTx = await contracts.mockUSDC.approve(networkConfig.savingCore, amountWei)
      await approveTx.wait()

      const depositTx = await contracts.savingCore.openDeposit(planId, amountWei)
      await depositTx.wait()

      await loadUsdcBalance(await signer.getAddress())
      await loadUserDeposits(await signer.getAddress())
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadUsdcBalance, loadUserDeposits])

  const withdraw = useCallback(async (depositId: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const tx = await contracts.savingCore.withdraw(depositId)
      await tx.wait()

      await loadUsdcBalance(await signer.getAddress())
      await loadUserDeposits(await signer.getAddress())
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadUsdcBalance, loadUserDeposits])

  const earlyWithdraw = useCallback(async (depositId: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const tx = await contracts.savingCore.earlyWithdraw(depositId)
      await tx.wait()

      await loadUsdcBalance(await signer.getAddress())
      await loadUserDeposits(await signer.getAddress())
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadUsdcBalance, loadUserDeposits])

  const renewDeposit = useCallback(async (depositId: number, newPlanId: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const tx = await contracts.savingCore.renewDeposit(depositId, newPlanId)
      await tx.wait()

      await loadUserDeposits(await signer.getAddress())
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadUserDeposits])

  const autoRenewDeposit = useCallback(async (depositId: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const tx = await contracts.savingCore.autoRenewDeposit(depositId)
      await tx.wait()

      await loadUserDeposits(await signer.getAddress())
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadUserDeposits])

  const createPlan = useCallback(async (tenorDays: number, aprBps: number, minDeposit: string, maxDeposit: string, penaltyBps: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const minWei = parseUnits(minDeposit, 6)
      const maxWei = parseUnits(maxDeposit, 6)
      const tx = await contracts.savingCore.createPlan(tenorDays, aprBps, minWei, maxWei, penaltyBps)
      await tx.wait()

      await loadPlans()
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadPlans])

  const updatePlan = useCallback(async (planId: number, newAprBps: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const tx = await contracts.savingCore.updatePlan(planId, newAprBps)
      await tx.wait()

      await loadPlans()
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadPlans])

  const enablePlan = useCallback(async (planId: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const tx = await contracts.savingCore.enablePlan(planId)
      await tx.wait()

      await loadPlans()
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadPlans])

  const disablePlan = useCallback(async (planId: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const tx = await contracts.savingCore.disablePlan(planId)
      await tx.wait()

      await loadPlans()
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadPlans])

  const mintUSDC = useCallback(async (toAddress: string, amount: string) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const amountWei = parseUnits(amount, 6)
      const tx = await contracts.mockUSDC.mint(toAddress, amountWei)
      await tx.wait()

      if (signer) {
        const address = await signer.getAddress()
        await loadUsdcBalance(address)
      }
    } catch (err: any) {
      setError(err.message || 'Mint failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts, loadUsdcBalance])

  const pauseSystem = useCallback(async () => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const isPaused = await contracts.savingCore.paused()
      if (isPaused) {
        setError('System is already paused')
        setLoading(false)
        return
      }

      const tx = await contracts.savingCore.pause()
      await tx.wait()
    } catch (err: any) {
      const errorMsg = err.message || 'Pause failed'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts])

  const unpauseSystem = useCallback(async () => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      const contracts = getContracts()
      if (!contracts) return

      const isPaused = await contracts.savingCore.paused()
      if (!isPaused) {
        setError('System is already active')
        setLoading(false)
        return
      }

      const tx = await contracts.savingCore.unpause()
      await tx.wait()
    } catch (err: any) {
      const errorMsg = err.message || 'Unpause failed'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [signer, getContracts])

  const getSystemStatus = useCallback(async () => {
    if (!signer) return { isPaused: false, vaultBalance: '0', totalDeposits: 0 }
    try {
      const contracts = getContracts()
      if (!contracts) return { isPaused: false, vaultBalance: '0', totalDeposits: 0 }

      const isPaused = await contracts.savingCore.paused()
      const vaultBalance = await contracts.vaultManager.getVaultBalance()
      const depositCount = await contracts.savingCore.depositCount()

      return {
        isPaused,
        vaultBalance: formatUnits(vaultBalance, 6),
        totalDeposits: Number(depositCount)
      }
    } catch (err) {
      console.error('Failed to get system status:', err)
      return { isPaused: false, vaultBalance: '0', totalDeposits: 0 }
    }
  }, [signer, getContracts])

  const getTransactionHistory = useCallback(async () => {
    if (!signer || !provider || !chainId) return []
    try {
      const contracts = getContracts()
      if (!contracts) return []

      const depositCount = await contracts.savingCore.depositCount()
      const transactions: any[] = []

      for (let i = 1; i <= Number(depositCount); i++) {
        const deposit = await contracts.savingCore.getDeposit(i)
        transactions.push({
          depositId: i,
          owner: deposit.owner,
          planId: Number(deposit.planId),
          principal: formatUnits(deposit.principal, 6),
          maturityAt: Number(deposit.maturityAt),
          aprBps: Number(deposit.aprBpsAtOpen),
          status: Number(deposit.status),
          statusText: ['Active', 'Withdrawn', 'ManualRenewed', 'AutoRenewed'][Number(deposit.status)]
        })
      }

      return transactions.reverse()
    } catch (err) {
      console.error('Failed to get transaction history:', err)
      return []
    }
  }, [signer, provider, chainId, getContracts])

  const increaseTime = useCallback(async (seconds: number) => {
    if (!signer || !provider) return
    // Only allow time travel on localhost (chainId 31337)
    if (chainId !== 31337) {
      throw new Error('Time travel only available on localhost')
    }
    setLoading(true)
    setError(null)
    try {
      // Call Hardhat JSON-RPC directly to bypass MetaMask
      // Step 1: Get current block timestamp
      const blockResponse = await fetch('/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
          id: Date.now()
        })
      })
      
      const blockResult = await blockResponse.json()
      if (blockResult.error) throw new Error(blockResult.error.message)
      
      const currentTs = parseInt(blockResult.result.timestamp, 16)
      const newTs = currentTs + seconds
      
      // Step 2: Set next block timestamp
      const setTsResponse = await fetch('/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           jsonrpc: '2.0',
           method: 'evm_setNextBlockTimestamp',
          params: [newTs],
          id: Date.now() + 1
        })
      })
      
      const setTsResult = await setTsResponse.json()
      if (setTsResult.error) throw new Error(setTsResult.error.message)
      
      // Step 3: Mine a new block
      const mineResponse = await fetch('/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           jsonrpc: '2.0',
           method: 'evm_mine',
          params: [],
          id: Date.now() + 2
        })
      })
      
      const mineResult = await mineResponse.json()
      if (mineResult.error) throw new Error(mineResult.error.message)
      
       // Refresh data after time travel
       const address = await signer.getAddress()
       await fetchBlockTimestamp()
       await loadPlans()
       await loadUsdcBalance(address)
       await loadUserDeposits(address)
    } catch (err: any) {
      setError(err.message || 'Time travel failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [signer, loadPlans, loadUsdcBalance, loadUserDeposits])

  useEffect(() => {
    if (signer) {
      loadPlans()
      fetchBlockTimestamp()
      signer.getAddress().then(async (address: string) => {
        await loadUsdcBalance(address)
        await loadUserDeposits(address)
      })
    }
  }, [signer, loadPlans, loadUsdcBalance, loadUserDeposits, fetchBlockTimestamp])

  return {
    plans,
    userDeposits,
    usdcBalance,
    owner,
    isOwner,
    loading,
    error,
    networkError,
    blockTimestamp,
    openDeposit,
    withdraw,
    earlyWithdraw,
    renewDeposit,
    autoRenewDeposit,
    createPlan,
    updatePlan,
    enablePlan,
    disablePlan,
    mintUSDC,
    pauseSystem,
    unpauseSystem,
    getSystemStatus,
    getTransactionHistory,
    increaseTime,
    refreshData: () => {
      if (signer) {
        signer.getAddress().then(async (address: string) => {
          await loadPlans()
          await loadUsdcBalance(address)
          await loadUserDeposits(address)
        })
      }
    },
  }
}
