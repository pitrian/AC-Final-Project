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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = useCallback(() => {
    if (!signer) return null
    return {
      savingCore: new Contract(SAVING_CORE_ADDRESS, SavingCoreABI, signer),
      mockUSDC: new Contract(MOCK_USDC_ADDRESS, MockUSDCABI, signer),
      vaultManager: new Contract(VAULT_MANAGER_ADDRESS, VaultManagerABI, signer),
    }
  }, [signer])

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

  useEffect(() => {
    if (signer) {
      loadPlans()
      signer.getAddress().then(async (address: string) => {
        await loadUsdcBalance(address)
        await loadUserDeposits(address)
      })
    }
  }, [signer, loadPlans, loadUsdcBalance, loadUserDeposits])

  return {
    plans,
    userDeposits,
    usdcBalance,
    loading,
    error,
    openDeposit,
    withdraw,
    earlyWithdraw,
    renewDeposit,
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
