import { useState } from 'react'
import { formatUnits } from 'ethers'
import type { DepositInfo, SavingPlan } from '../types'

interface MyDepositsProps {
  deposits: (DepositInfo & { depositId: number })[]
  plans: { [key: number]: SavingPlan }
  onWithdraw: (depositId: number) => Promise<void>
  onEarlyWithdraw: (depositId: number) => Promise<void>
  onRenew: (depositId: number, newPlanId: number) => Promise<void>
  loading: boolean
  error: string | null
}

export default function MyDeposits({
  deposits,
  plans,
  onWithdraw,
  onEarlyWithdraw,
  onRenew,
  loading,
  error,
}: MyDepositsProps) {
  const [renewPlanId, setRenewPlanId] = useState<{ [key: number]: number }>({})
  const now = Math.floor(Date.now() / 1000)

  const enabledPlans = Object.values(plans).filter(p => p.enabled)

  const handleRenew = async (depositId: number) => {
    const newPlanId = renewPlanId[depositId] || Number(deposits.find(d => d.depositId === depositId)?.planId)
    await onRenew(depositId, newPlanId)
    setRenewPlanId(prev => ({ ...prev, [depositId]: 0 }))
  }

  if (deposits.length === 0) {
    return <div className="empty-state">No active deposits</div>
  }

  return (
    <div className="deposits-list">
      {error && <div className="error">{error}</div>}
      {deposits.map(deposit => {
        const principal = Number(formatUnits(deposit.principal, 6))
        const aprPercent = Number(formatUnits(deposit.aprBpsAtOpen, 2))
        const penaltyPercent = Number(formatUnits(deposit.penaltyBpsAtOpen, 2))
        const maturityDate = new Date(Number(deposit.maturityAt) * 1000).toLocaleDateString()
        const isMatured = now >= Number(deposit.maturityAt)

        const statusLabel =
          deposit.status === 0 ? 'Active' :
          deposit.status === 1 ? 'Withdrawn' :
          deposit.status === 2 ? 'Manually Renewed' : 'Auto Renewed'

        const daysRemaining = Math.max(0, Math.floor((Number(deposit.maturityAt) - now) / 86400))

        return (
          <div key={deposit.depositId} className={`deposit-card ${isMatured ? 'matured' : ''}`}>
            <div className="deposit-header">
              <h4>Deposit #{deposit.depositId}</h4>
              <span className={`badge ${isMatured ? 'badge-matured' : 'badge-active'}`}>
                {statusLabel}
              </span>
            </div>
            <div className="deposit-details">
              <div className="deposit-detail">
                <span className="label">Principal</span>
                <span className="value">{principal.toLocaleString()} USDC</span>
              </div>
              <div className="deposit-detail">
                <span className="label">APR</span>
                <span className="value highlight">{aprPercent.toFixed(2)}%</span>
              </div>
              <div className="deposit-detail">
                <span className="label">Maturity</span>
                <span className="value">{maturityDate}</span>
              </div>
              <div className="deposit-detail">
                <span className="label">Time Remaining</span>
                <span className="value">{isMatured ? 'Matured' : `${daysRemaining} days`}</span>
              </div>
              <div className="deposit-detail">
                <span className="label">Penalty (early)</span>
                <span className="value warning">{penaltyPercent.toFixed(2)}%</span>
              </div>
            </div>
            <div className="deposit-actions">
              {!isMatured && (
                <button
                  className="btn-danger"
                  onClick={() => onEarlyWithdraw(deposit.depositId)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Early Withdraw'}
                </button>
              )}
              {isMatured && deposit.status === 0 && (
                <button
                  className="btn-primary"
                  onClick={() => onWithdraw(deposit.depositId)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Withdraw'}
                </button>
              )}
              {isMatured && deposit.status === 0 && (
                <div className="renew-section">
                  <select
                    value={renewPlanId[deposit.depositId] || ''}
                    onChange={(e) => setRenewPlanId(prev => ({ ...prev, [deposit.depositId]: Number(e.target.value) }))}
                    disabled={loading}
                    className="plan-select"
                  >
                    <option value="">Select Plan to Renew</option>
                    {enabledPlans.map(p => (
                      <option key={Number(p.planId)} value={Number(p.planId)}>
                        Plan #{Number(p.planId)} - {Number(formatUnits(p.aprBps, 2)).toFixed(2)}% APR - {Number(p.tenorDays)} days
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn-secondary"
                    onClick={() => handleRenew(deposit.depositId)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Renew'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
