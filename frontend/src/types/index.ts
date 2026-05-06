export interface SavingPlan {
  planId: bigint
  tenorDays: bigint
  aprBps: bigint
  minDeposit: bigint
  maxDeposit: bigint
  penaltyBps: bigint
  enabled: boolean
}

export interface DepositInfo {
  owner: string
  planId: bigint
  principal: bigint
  maturityAt: bigint
  aprBpsAtOpen: bigint
  penaltyBpsAtOpen: bigint
  status: number
}

export const DepositStatus = {
  Active: 0,
  Withdrawn: 1,
  ManualRenewed: 2,
  AutoRenewed: 3
} as const

export interface WalletState {
  address: string | null
  signer: any | null
  provider: any | null
  balance: string
  usdcBalance: string
  isConnected: boolean
  isConnecting: boolean
  chainId: number | null
}
