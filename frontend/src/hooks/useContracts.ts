import { useState, useCallback, useEffect } from 'react'
import { Contract, formatUnits, parseUnits, JsonRpcSigner, BrowserProvider } from 'ethers'
import { SavingCoreABI, MockUSDCABI, VaultManagerABI } from '../contracts/abis'
import type { SavingPlan, DepositInfo } from '../types'

const SAVING_CORE_ADDRESS = import.meta.env.VITE_SAVING_CORE_ADDRESS || ''
const MOCK_USDC_ADDRESS = import.meta.env.VITE_MOCK_USDC_ADDRESS || ''
const VAULT_MANAGER_ADDRESS = import.meta.env.VITE_VAULT_MANAGER_ADDRESS || ''

export function useContracts(signer: JsonRpcSigner | null, provider: BrowserProvider | null) {
  const [plans, setPlans] = useState<SavingPlan[]>([])
  const [userDeposits, setUserDeposits] = useState<(DepositInfo & { depositId: number })[]>([])
  const [usdcBalance, setUsdcBalance] = useState<string>('0')
  const [owner, setOwner] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockTimestamp, setBlockTimestamp] = useState<number>(Math.floor(Date.now() / 1000))

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
    if (!signer) return null
    return {
      savingCore: new Contract(SAVING_CORE_ADDRESS, SavingCoreABI, signer),
      mockUSDC: new Contract(MOCK_USDC_ADDRESS, MockUSDCABI, signer),
      vaultManager: new Contract(VAULT_MANAGER_ADDRESS, VaultManagerABI, signer),
    }
  }, [signer])

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

      const approveTx = await contracts.mockUSDC.approve(SAVING_CORE_ADDRESS, amountWei)
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

  const increaseTime = useCallback(async (seconds: number) => {
    if (!signer) return
    setLoading(true)
    setError(null)
    try {
      // Call Hardhat JSON-RPC directly to bypass MetaMask
      // Step 1: Get current block timestamp
      const blockResponse = await fetch('http://localhost:8545', {
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
      const setTsResponse = await fetch('http://localhost:8545', {
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
      const mineResponse = await fetch('http://localhost:8545', {
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
