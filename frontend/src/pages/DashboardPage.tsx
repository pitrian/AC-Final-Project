import { useState } from 'react'
import { formatUnits } from 'ethers'
import type { SavingPlan, DepositInfo } from '../types'
import { DepositStatus } from '../types'

interface DashboardPageProps {
  plans: SavingPlan[]
  userDeposits: (DepositInfo & { depositId: number })[]
  usdcBalance: string
  blockTimestamp: number
  selectedPlanId: number | null
  onSelectPlan: (planId: number | null) => void
  onOpenDeposit: (planId: number, amount: string) => Promise<void>
  onWithdraw: (depositId: number) => Promise<void>
  onEarlyWithdraw: (depositId: number) => Promise<void>
  onRenewDeposit: (depositId: number, newPlanId: number) => Promise<void>
  isSystemPaused: boolean
  loading: boolean
  error: string | null
}

export default function DashboardPage({
  plans,
  userDeposits,
  usdcBalance,
  blockTimestamp,
  selectedPlanId,
  onSelectPlan,
  onOpenDeposit,
  onWithdraw,
  onEarlyWithdraw,
  onRenewDeposit,
  isSystemPaused,
  loading,
  error
}: DashboardPageProps) {
  const [depositAmount, setDepositAmount] = useState('')
  const [depositError, setDepositError] = useState('')
  const [activeTab, setActiveTab] = useState<'deposits' | 'products'>('deposits')
  const [renewPlanId, setRenewPlanId] = useState<Record<number, number>>({})

  const totalPrincipal = userDeposits.reduce((sum, d) => sum + Number(d.principal), 0)
  const activeDeposits = userDeposits.filter(d => d.status === DepositStatus.Active)

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (maturityAt: bigint) => {
    const remaining = Number(maturityAt) - blockTimestamp
    return Math.max(0, Math.floor(remaining / 86400))
  }

  const getProgress = (maturityAt: bigint, tenorDays: number) => {
    const total = Number(tenorDays) * 86400
    const elapsed = blockTimestamp - (Number(maturityAt) - total)
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  const handleDeposit = async () => {
    if (!selectedPlanId || !depositAmount) return
    
    const amount = parseFloat(depositAmount)
    const plan = plans.find(p => Number(p.planId) === selectedPlanId)
    
    if (!plan) return
    
    const minDeposit = Number(plan.minDeposit) / 1e6
    const maxDeposit = Number(plan.maxDeposit) / 1e6
    
    if (amount < minDeposit) {
      setDepositError(`Amount must be at least ${minDeposit} USDC`)
      return
    }
    if (amount > maxDeposit) {
      setDepositError(`Amount cannot exceed ${maxDeposit} USDC`)
      return
    }
    
    setDepositError('')
    await onOpenDeposit(selectedPlanId, depositAmount)
    setDepositAmount('')
  }

  return (
    <div className="dashboard-page">
      {/* System Paused Warning */}
      {isSystemPaused && (
        <div className="system-paused-alert">
          <h3>⏸️ System is Currently Paused</h3>
          <p>All deposit, withdraw, and renew operations are temporarily disabled.</p>
        </div>
      )}

      {/* Metrics */}
      <div className="dashboard">
        <h2 className="dashboard-title">My Portfolio</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon balance">💰</div>
            <div className="metric-label">USDC Balance</div>
            <div className="metric-value currency">{parseFloat(usdcBalance).toFixed(2)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon deposits">📋</div>
            <div className="metric-label">Total Principal</div>
            <div className="metric-value currency">{formatUnits(BigInt(totalPrincipal), 6)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon interest">📈</div>
            <div className="metric-label">Active Deposits</div>
            <div className="metric-value">{activeDeposits.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon nfts">🎫</div>
            <div className="metric-label">NFT Certificates</div>
            <div className="metric-value">{userDeposits.length}</div>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Tabs */}
      <div className="section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'deposits' ? 'active' : ''}`}
            onClick={() => setActiveTab('deposits')}
          >
            My Deposits
          </button>
          <button 
            className={`tab ${activeTab === 'products' ? 'active' : ''} ${isSystemPaused ? 'disabled' : ''}`}
            onClick={() => !isSystemPaused && setActiveTab('products')}
            style={isSystemPaused ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            Open New Deposit
          </button>
        </div>

        {/* My Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="deposits-list">
            {userDeposits.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No Deposits Yet</h3>
                <p>Start by opening a new deposit in the Products tab</p>
                <button className="btn btn-primary" onClick={() => !isSystemPaused && setActiveTab('products')} disabled={isSystemPaused}>
                  Open Deposit
                </button>
              </div>
            ) : (
              userDeposits.map((deposit) => {
                const plan = plans.find(p => Number(p.planId) === Number(deposit.planId))
                const isMatured = blockTimestamp >= Number(deposit.maturityAt)
                const daysRemaining = getDaysRemaining(deposit.maturityAt)
                const progress = plan ? getProgress(deposit.maturityAt, Number(plan.tenorDays)) : 0

                return (
                  <div key={deposit.depositId} className={`deposit-card ${isMatured ? 'matured' : ''}`}>
                    <div className="deposit-header">
                      <div className="deposit-id">
                        <div className="deposit-id-icon">🎫</div>
                        <div>
                          <h4>Deposit #{deposit.depositId}</h4>
                          <span>Plan #{deposit.planId} • {plan ? `${plan.tenorDays} days` : 'N/A'}</span>
                        </div>
                      </div>
                      <span className={`deposit-status ${deposit.status === DepositStatus.Active ? 'active' : deposit.status === DepositStatus.Withdrawn ? 'withdrawn' : 'matured'}`}>
                        {deposit.status === DepositStatus.Active && isMatured ? 'Ready to Withdraw' : 
                         deposit.status === DepositStatus.Active ? 'Active' :
                         deposit.status === DepositStatus.Withdrawn ? 'Withdrawn' :
                         deposit.status === DepositStatus.ManualRenewed ? 'Renewed' : 'Auto-Renewed'}
                      </span>
                    </div>

                    {deposit.status === DepositStatus.Active && (
                      <div className="deposit-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="progress-text">
                          {isMatured ? '🎉 Matured!' : `${daysRemaining} days remaining`}
                        </div>
                      </div>
                    )}

                    <div className="deposit-details">
                      <div className="deposit-detail">
                        <span className="label">Principal</span>
                        <span className="value">{formatUnits(deposit.principal, 6)} USDC</span>
                      </div>
                      <div className="deposit-detail">
                        <span className="label">APR</span>
                        <span className="value highlight">{Number(deposit.aprBpsAtOpen) / 100}%</span>
                      </div>
                      <div className="deposit-detail">
                        <span className="label">Maturity</span>
                        <span className="value">{formatDate(deposit.maturityAt)}</span>
                      </div>
                      <div className="deposit-detail">
                        <span className="label">Penalty</span>
                        <span className="value">{Number(deposit.penaltyBpsAtOpen) / 100}%</span>
                      </div>
                      <div className="deposit-detail">
                        <span className="label">Est. Interest</span>
                        <span className="value highlight">
                          {formatUnits((deposit.principal * deposit.aprBpsAtOpen * BigInt(Number(plan?.tenorDays || 0) * 86400)) / BigInt(315360000000), 6)} USDC
                        </span>
                      </div>
                    </div>

                    {deposit.status === DepositStatus.Active && (
                      <div className="deposit-actions">
                        {!isMatured ? (
                          <button 
                            className="btn btn-danger"
                            onClick={() => onEarlyWithdraw(deposit.depositId)}
                            disabled={loading || isSystemPaused}
                          >
                            Early Withdraw
                          </button>
                        ) : (
                          <button 
                            className="btn btn-primary"
                            onClick={() => onWithdraw(deposit.depositId)}
                            disabled={loading || isSystemPaused}
                          >
                            Withdraw
                          </button>
                        )}
                        {isMatured && !isSystemPaused && (
                          <select 
                            className="btn btn-secondary"
                            style={{ minWidth: 150 }}
                            value={renewPlanId[deposit.depositId] || ''}
                            onChange={(e) => setRenewPlanId(prev => ({ ...prev, [deposit.depositId]: Number(e.target.value) }))}
                          >
                            <option value="">Renew to...</option>
                            {plans.filter(p => p.enabled).map(p => (
                              <option key={Number(p.planId)} value={Number(p.planId)}>
                                Plan #{p.planId} - {Number(p.aprBps)/100}% ({p.tenorDays} days)
                              </option>
                            ))}
                          </select>
                        )}
                        {isMatured && !isSystemPaused && renewPlanId[deposit.depositId] && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => onRenewDeposit(deposit.depositId, renewPlanId[deposit.depositId])}
                            disabled={loading}
                          >
                            Confirm Renew
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="plans-grid">
              {plans.map((plan) => (
                <div 
                  key={plan.planId.toString()}
                  className={`plan-card ${selectedPlanId === Number(plan.planId) ? 'selected' : ''} ${!plan.enabled ? 'disabled' : ''}`}
                  onClick={() => plan.enabled && onSelectPlan(Number(plan.planId))}
                >
                  <span className={`plan-badge ${plan.enabled ? 'active' : 'inactive'}`}>
                    {plan.enabled ? 'Available' : 'Disabled'}
                  </span>
                  <div className="plan-tenor">
                    {plan.tenorDays.toString()} <span>days</span>
                  </div>
                  <div className="plan-apr">
                    {Number(plan.aprBps) / 100} <span>% APR</span>
                  </div>
                  <div className="plan-details">
                    <div className="plan-detail">
                      <span className="label">Min Deposit</span>
                      <span className="value">{formatUnits(plan.minDeposit, 6)} USDC</span>
                    </div>
                    <div className="plan-detail">
                      <span className="label">Max Deposit</span>
                      <span className="value">{formatUnits(plan.maxDeposit, 6)} USDC</span>
                    </div>
                    <div className="plan-detail">
                      <span className="label">Early Exit Fee</span>
                      <span className="value">{Number(plan.penaltyBps) / 100}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedPlanId && (
              <div className="deposit-form" style={{ marginTop: 32 }}>
                <h3>💰 Deposit to Plan #{selectedPlanId}</h3>
                <div className="form-info">
                  {(() => {
                    const plan = plans.find(p => Number(p.planId) === selectedPlanId)
                    if (!plan) return null
                    return (
                      <>
                        <div className="form-info-item">
                          <span className="label">Tenor</span>
                          <span className="value">{plan.tenorDays} days</span>
                        </div>
                        <div className="form-info-item">
                          <span className="label">APR</span>
                          <span className="value">{Number(plan.aprBps) / 100}%</span>
                        </div>
                        <div className="form-info-item">
                          <span className="label">Your Balance</span>
                          <span className="value">{parseFloat(usdcBalance).toFixed(2)} USDC</span>
                        </div>
                        <div className="form-info-item">
                          <span className="label">Penalty</span>
                          <span className="value">{Number(plan.penaltyBps) / 100}%</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <div className="form-group">
<input
                      type="number"
                      placeholder="Enter amount in USDC"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value)
                        setDepositError('')
                      }}
                      disabled={isSystemPaused}
                    />
                  <button 
                    className="max-btn"
                    onClick={() => setDepositAmount(usdcBalance)}
                    disabled={isSystemPaused}
                  >
                    MAX
                  </button>
                </div>
                {depositError && (
                  <div className="form-error" style={{ color: '#dc3545', marginBottom: 12, fontSize: 14 }}>
                    ⚠️ {depositError}
                  </div>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={handleDeposit}
                  disabled={loading || !depositAmount || isSystemPaused || !!depositError}
                >
                  {loading ? 'Processing...' : isSystemPaused ? 'System Paused' : 'Confirm Deposit'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}