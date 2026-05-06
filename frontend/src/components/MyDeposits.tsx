import { useState } from 'react'
import { formatUnits } from 'ethers'
import type { DepositInfo, SavingPlan } from '../types'

interface MyDepositsProps {
  deposits: (DepositInfo & { depositId: number })[]
  plans: { [key: number]: SavingPlan }
  onWithdraw: (depositId: number) => Promise<void>
  onEarlyWithdraw: (depositId: number) => Promise<void>
  onRenew: (depositId: number, newPlanId: number) => Promise<void>
  onAutoRenew: (depositId: number) => Promise<void>
  loading: boolean
  error: string | null
  blockTimestamp: number
}

export default function MyDeposits({
  deposits,
  plans,
  onWithdraw,
  onEarlyWithdraw,
  onRenew,
  onAutoRenew,
  loading,
  error,
  blockTimestamp,
}: MyDepositsProps) {
  const [renewPlanId, setRenewPlanId] = useState<{ [key: number]: number }>({})
  const now = blockTimestamp

  const enabledPlans = Object.values(plans).filter(p => p.enabled)

  const handleRenew = async (depositId: number) => {
    const newPlanId = renewPlanId[depositId] || Number(deposits.find(d => d.depositId === depositId)?.planId)
    await onRenew(depositId, newPlanId)
    setRenewPlanId(prev => ({ ...prev, [depositId]: 0 }))
  }

  const blockDate = new Date(blockTimestamp * 1000).toLocaleString()

  if (deposits.length === 0) {
    return (
      <div>
        <div className="debug-info" style={{background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px'}}>
          Block Time: {blockDate} (Timestamp: {blockTimestamp})
        </div>
        <div className="empty-state">No active deposits</div>
      </div>
    )
  }

  return (
    <>
      <div className="debug-info" style={{background: '#1a1a2e', padding: '8px 16px', margin: '10px 0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '20px', color: '#e0e0e0', flexWrap: 'wrap', borderRadius: '8px', border: '1px solid #2d2d44'}}>
        <span>🕐 Block Time: <strong style={{color: '#fff'}}>{blockDate}</strong></span>
        <span style={{color: '#888'}}>Timestamp: {blockTimestamp}</span>
      </div>
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
          const gracePeriodEnd = Number(deposit.maturityAt) + 3 * 86400
          const isGracePeriodOver = now >= gracePeriodEnd
          const canAutoRenew = deposit.status === 0 && isGracePeriodOver

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
                {isMatured && deposit.status === 0 && !isGracePeriodOver && (
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
                {canAutoRenew && (
                  <div className="renew-section" style={{background: '#1e1b4a', padding: '10px', borderRadius: '8px', border: '1px solid #78350f'}}>
                    <div style={{color: '#fbbf24', marginBottom: '8px', fontSize: '13px'}}>
                      ⚠️ Grace period ended - Auto-renewal ready
                    </div>
                    <button
                      className="btn-warning"
                      onClick={() => onAutoRenew(deposit.depositId)}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Confirm Auto-Renewal (Sign Required)'}
                    </button>
                  </div>
                )}
               </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
