import { useState } from 'react'
import type { SavingPlan } from '../types'

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

  const handleTimeTravel = async (seconds: number) => {
    await onIncreaseTime(seconds)
  }

  return (
    <div className="admin-page">
      <div className="admin-panel">
        <h2>🔧 Admin Panel</h2>
        <p className="admin-info">
          Connected as owner: <span className="address">{owner?.slice(0, 6)}...{owner?.slice(-4)}</span>
        </p>

        {error && <div className="error">{error}</div>}

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

        {/* Mint USDC */}
        <div className="admin-section">
          <h3>Mint USDC to User</h3>
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

        {/* Time Travel */}
        <div className="admin-section">
          <h3>⏰ Time Travel (Testing Only)</h3>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={() => handleTimeTravel(86400)} disabled={loading}>
              +1 Day
            </button>
            <button className="btn btn-secondary" onClick={() => handleTimeTravel(7 * 86400)} disabled={loading}>
              +7 Days
            </button>
            <button className="btn btn-secondary" onClick={() => handleTimeTravel(30 * 86400)} disabled={loading}>
              +30 Days
            </button>
            <button className="btn btn-secondary" onClick={() => handleTimeTravel(90 * 86400)} disabled={loading}>
              +90 Days
            </button>
            <button className="btn btn-warning" onClick={() => handleTimeTravel(3 * 86400)} disabled={loading}>
              +3 Days (Grace)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}