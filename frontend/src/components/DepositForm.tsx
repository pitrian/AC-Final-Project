import { useState } from 'react'

interface DepositFormProps {
  selectedPlanId: number | null
  planTenorDays: number | null
  planMinDeposit: number | null
  planMaxDeposit: number | null
  usdcBalance: string
  onDeposit: (planId: number, amount: string) => Promise<void>
  loading: boolean
  error: string | null
}

export default function DepositForm({
  selectedPlanId,
  planTenorDays,
  planMinDeposit,
  planMaxDeposit,
  usdcBalance,
  onDeposit,
  loading,
  error,
}: DepositFormProps) {
  const [amount, setAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanId || !amount) return
    await onDeposit(selectedPlanId, amount)
    setAmount('')
  }

  if (!selectedPlanId) {
    return (
      <div className="empty-state">
        Select a plan above to open a deposit
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="deposit-form">
      <h3>Open Deposit - Plan #{selectedPlanId}</h3>
      <div className="form-info">
        <span>Tenor: {planTenorDays} days</span>
        <span>Range: {planMinDeposit?.toLocaleString()} - {planMaxDeposit?.toLocaleString()} USDC</span>
        <span>Balance: {usdcBalance} USDC</span>
      </div>
      <div className="form-group">
        <label>Amount (USDC)</label>
        <input
          type="number"
          step="0.000001"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
          disabled={loading}
        />
        <button
          type="button"
          className="max-btn"
          onClick={() => setAmount(usdcBalance)}
          disabled={loading}
        >
          MAX
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Processing...' : 'Open Deposit'}
      </button>
    </form>
  )
}
