import { useState, useEffect } from 'react'
import type { SavingPlan } from '../types'

interface Transaction {
  depositId: number
  owner: string
  planId: number
  principal: string
  maturityAt: number
  aprBps: number
  status: number
  statusText: string
}

interface SystemStatus {
  isPaused: boolean
  vaultBalance: string
  totalDeposits: number
}

interface AdminPageProps {
  owner: string | null
  plans: SavingPlan[]
  blockTimestamp: number
  onCreatePlan: (tenorDays: number, aprBps: number, minDeposit: string, maxDeposit: string, penaltyBps: number) => Promise<void>
  onUpdatePlan: (planId: number, newAprBps: number) => Promise<void>
  onEnablePlan: (planId: number) => Promise<void>
  onDisablePlan: (planId: number) => Promise<void>
  onMintUSDC: (toAddress: string, amount: string) => Promise<void>
  onIncreaseTime: (seconds: number) => Promise<void>
  onPauseSystem: () => Promise<void>
  onUnpauseSystem: () => Promise<void>
  onGetSystemStatus: () => Promise<SystemStatus>
  onGetTransactionHistory: () => Promise<Transaction[]>
  loading: boolean
  error: string | null
}

export default function AdminPage({
  owner,
  plans,
  onCreatePlan,
  onUpdatePlan,
  onEnablePlan,
  onDisablePlan,
  onMintUSDC,
  onIncreaseTime,
  onPauseSystem,
  onUnpauseSystem,
  onGetSystemStatus,
  onGetTransactionHistory,
  loading,
  error
}: AdminPageProps) {
  const [tenorDays, setTenorDays] = useState('')
  const [aprPercent, setAprPercent] = useState('')
  const [minDeposit, setMinDeposit] = useState('')
  const [maxDeposit, setMaxDeposit] = useState('')
  const [penaltyPercent, setPenaltyPercent] = useState('')
  const [updatePlanId, setUpdatePlanId] = useState('')
  const [newAprPercent, setNewAprPercent] = useState('')
  const [mintAddress, setMintAddress] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ isPaused: false, vaultBalance: '0', totalDeposits: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'plans' | 'mint' | 'time'>('status')

  useEffect(() => {
    loadSystemStatus()
    loadTransactions()
  }, [])

  const loadSystemStatus = async () => {
    try {
      const status = await onGetSystemStatus()
      setSystemStatus(status)
    } catch (err) {
      console.error('Failed to load system status:', err)
    }
  }

  const loadTransactions = async () => {
    try {
      const txs = await onGetTransactionHistory()
      setTransactions(txs)
    } catch (err) {
      console.error('Failed to load transactions:', err)
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenorDays || !aprPercent || !minDeposit || !maxDeposit || !penaltyPercent) return
    const aprBps = Math.round(parseFloat(aprPercent) * 100)
    const penaltyBps = Math.round(parseFloat(penaltyPercent) * 100)
    await onCreatePlan(parseInt(tenorDays), aprBps, minDeposit, maxDeposit, penaltyBps)
    setTenorDays('')
    setAprPercent('')
    setMinDeposit('')
    setMaxDeposit('')
    setPenaltyPercent('')
  }

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updatePlanId || !newAprPercent) return
    const newAprBps = Math.round(parseFloat(newAprPercent) * 100)
    await onUpdatePlan(parseInt(updatePlanId), newAprBps)
    setUpdatePlanId('')
    setNewAprPercent('')
  }

  const handleMintUSDC = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mintAddress || !mintAmount) return
    await onMintUSDC(mintAddress, mintAmount)
    setMintAddress('')
    setMintAmount('')
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="admin-page">
      <div className="admin-panel">
        <h2>🔧 Admin Panel</h2>
        <p className="admin-info">
          Connected as owner: <span className="address">{owner?.slice(0, 6)}...{owner?.slice(-4)}</span>
        </p>

        {error && <div className="error">{error}</div>}

        {/* Tab Navigation */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>📊 System Status</button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📜 History</button>
          <button className={`tab ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>📋 Plans</button>
          <button className={`tab ${activeTab === 'mint' ? 'active' : ''}`} onClick={() => setActiveTab('mint')}>💰 Mint</button>
          <button className={`tab ${activeTab === 'time' ? 'active' : ''}`} onClick={() => setActiveTab('time')}>⏰ Time</button>
        </div>

        {/* System Status Tab */}
        {activeTab === 'status' && (
          <div className="admin-section">
            <h3>📊 System Status</h3>
            
            <div className="metrics-grid" style={{ marginBottom: 24 }}>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: systemStatus.isPaused ? 'linear-gradient(135deg, #e17055, #d63031)' : 'linear-gradient(135deg, #00b894, #00cec9)' }}>
                  {systemStatus.isPaused ? '⏸️' : '✅'}
                </div>
                <div className="metric-label">System Status</div>
                <div className="metric-value" style={{ color: systemStatus.isPaused ? '#e17055' : '#00b894' }}>
                  {systemStatus.isPaused ? 'PAUSED' : 'ACTIVE'}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #0984e3, #74b9ff)' }}>🏦</div>
                <div className="metric-label">Vault Balance</div>
                <div className="metric-value currency">{parseFloat(systemStatus.vaultBalance).toFixed(2)}</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}>📋</div>
                <div className="metric-label">Total Deposits</div>
                <div className="metric-value">{systemStatus.totalDeposits}</div>
              </div>
            </div>

            <div className="button-group">
              <button 
                className="btn btn-danger" 
                onClick={async () => { await onPauseSystem(); loadSystemStatus(); }}
                disabled={loading || systemStatus.isPaused}
              >
                ⏸️ Pause System
              </button>
              <button 
                className="btn btn-primary" 
                onClick={async () => { await onUnpauseSystem(); loadSystemStatus(); }}
                disabled={loading || !systemStatus.isPaused}
              >
                ▶️ Unpause System
              </button>
            </div>

            {systemStatus.isPaused && (
              <div style={{ marginTop: 16, padding: 16, background: '#ffeaea', borderRadius: 8, color: '#e17055' }}>
                ⚠️ System is currently paused. All deposit, withdraw, and renew operations are disabled.
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="admin-section">
            <h3>📜 Transaction History</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>All deposits in the system</p>
            
            {transactions.length === 0 ? (
              <div className="empty-state">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Owner</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Plan</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Principal</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Maturity</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>APR</th>
                      <th style={{ padding: 12, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.depositId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 12 }}>#{tx.depositId}</td>
                        <td style={{ padding: 12, fontFamily: 'monospace', fontSize: '0.85rem' }}>{tx.owner.slice(0, 6)}...{tx.owner.slice(-4)}</td>
                        <td style={{ padding: 12 }}>Plan {tx.planId}</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{tx.principal} USDC</td>
                        <td style={{ padding: 12 }}>{formatDate(tx.maturityAt)}</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{tx.aprBps / 100}%</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span className={`deposit-status ${tx.status === 0 ? 'active' : tx.status === 1 ? 'withdrawn' : 'matured'}`}>
                            {tx.statusText}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <>
            {/* Create Plan */}
            <div className="admin-section">
              <h3>Create New Plan</h3>
              <form onSubmit={handleCreatePlan} className="admin-form">
                <div className="form-group">
                  <label>Tenor (days)</label>
                  <input type="number" value={tenorDays} onChange={e => setTenorDays(e.target.value)} placeholder="30" required />
                </div>
                <div className="form-group">
                  <label>APR (%)</label>
                  <input type="number" step="0.01" value={aprPercent} onChange={e => setAprPercent(e.target.value)} placeholder="5" required />
                </div>
                <div className="form-group">
                  <label>Min Deposit (USDC)</label>
                  <input type="number" value={minDeposit} onChange={e => setMinDeposit(e.target.value)} placeholder="100" required />
                </div>
                <div className="form-group">
                  <label>Max Deposit (USDC)</label>
                  <input type="number" value={maxDeposit} onChange={e => setMaxDeposit(e.target.value)} placeholder="10000" required />
                </div>
                <div className="form-group">
                  <label>Penalty (%)</label>
                  <input type="number" step="0.01" value={penaltyPercent} onChange={e => setPenaltyPercent(e.target.value)} placeholder="5" required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>Create Plan</button>
              </form>
            </div>

            {/* Update Plan APR */}
            <div className="admin-section">
              <h3>Update Plan APR</h3>
              <form onSubmit={handleUpdatePlan} className="admin-form">
                <div className="form-group">
                  <label>Plan ID</label>
                  <input type="number" value={updatePlanId} onChange={e => setUpdatePlanId(e.target.value)} placeholder="1" required />
                </div>
                <div className="form-group">
                  <label>New APR (%)</label>
                  <input type="number" step="0.01" value={newAprPercent} onChange={e => setNewAprPercent(e.target.value)} placeholder="6" required />
                </div>
                <button type="submit" className="btn btn-secondary" disabled={loading}>Update APR</button>
              </form>
            </div>

            {/* Enable/Disable Plan */}
            <div className="admin-section">
              <h3>Enable/Disable Plans</h3>
              <div className="plans-grid" style={{ marginTop: 16 }}>
                {plans.map(plan => (
                  <div key={plan.planId.toString()} className="plan-card" style={{ cursor: 'default' }}>
                    <div className="plan-header">
                      <h3>Plan #{plan.planId}</h3>
                      <span className={`plan-badge ${plan.enabled ? 'active' : 'inactive'}`}>
                        {plan.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="plan-details">
                      <div className="plan-detail">
                        <span className="label">Tenor</span>
                        <span className="value">{plan.tenorDays} days</span>
                      </div>
                      <div className="plan-detail">
                        <span className="label">APR</span>
                        <span className="value">{Number(plan.aprBps) / 100}%</span>
                      </div>
                    </div>
                    <div className="button-group" style={{ marginTop: 16 }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => onEnablePlan(Number(plan.planId))}
                        disabled={loading || plan.enabled}
                      >
                        Enable
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => onDisablePlan(Number(plan.planId))}
                        disabled={loading || !plan.enabled}
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Mint Tab */}
        {activeTab === 'mint' && (
          <div className="admin-section">
            <h3>💰 Mint USDC to User</h3>
            <form onSubmit={handleMintUSDC} className="admin-form">
              <div className="form-group">
                <label>User Address</label>
                <input type="text" value={mintAddress} onChange={e => setMintAddress(e.target.value)} placeholder="0x..." required />
              </div>
              <div className="form-group">
                <label>Amount (USDC)</label>
                <input type="number" value={mintAmount} onChange={e => setMintAmount(e.target.value)} placeholder="10000" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>Mint USDC</button>
            </form>
          </div>
        )}

        {/* Time Travel Tab */}
        {activeTab === 'time' && (
          <div className="admin-section">
            <h3>⏰ Time Travel (Testing Only)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Fast forward blockchain time for testing</p>
            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => onIncreaseTime(86400)} disabled={loading}>+1 Day</button>
              <button className="btn btn-secondary" onClick={() => onIncreaseTime(7 * 86400)} disabled={loading}>+7 Days</button>
              <button className="btn btn-secondary" onClick={() => onIncreaseTime(30 * 86400)} disabled={loading}>+30 Days</button>
              <button className="btn btn-secondary" onClick={() => onIncreaseTime(90 * 86400)} disabled={loading}>+90 Days</button>
              <button className="btn btn-warning" onClick={() => onIncreaseTime(3 * 86400)} disabled={loading}>+3 Days (Grace)</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}