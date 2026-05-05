import { useState } from 'react'

interface AdminPanelProps {
  owner: string | null
  onCreatePlan: (tenorDays: number, aprBps: number, minDeposit: string, maxDeposit: string, penaltyBps: number) => Promise<void>
  onUpdatePlan: (planId: number, newAprBps: number) => Promise<void>
  onEnablePlan: (planId: number) => Promise<void>
  onDisablePlan: (planId: number) => Promise<void>
  loading: boolean
  error: string | null
}

export default function AdminPanel({ owner, onCreatePlan, onUpdatePlan, onEnablePlan, onDisablePlan, loading, error }: AdminPanelProps) {
  const [tenorDays, setTenorDays] = useState('')
  const [aprPercent, setAprPercent] = useState('')
  const [minDeposit, setMinDeposit] = useState('')
  const [maxDeposit, setMaxDeposit] = useState('')
  const [penaltyPercent, setPenaltyPercent] = useState('')
  const [updatePlanId, setUpdatePlanId] = useState('')
  const [newAprPercent, setNewAprPercent] = useState('')
  const [togglePlanId, setTogglePlanId] = useState('')

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenorDays || !aprPercent || !minDeposit || !maxDeposit || !penaltyPercent) return
    const aprBps = Math.round(parseFloat(aprPercent) * 100)
    const penaltyBps = Math.round(parseFloat(penaltyPercent) * 100)
    await onCreatePlan(
      parseInt(tenorDays),
      aprBps,
      minDeposit,
      maxDeposit,
      penaltyBps
    )
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

  const handleEnablePlan = async () => {
    if (!togglePlanId) return
    await onEnablePlan(parseInt(togglePlanId))
    setTogglePlanId('')
  }

  const handleDisablePlan = async () => {
    if (!togglePlanId) return
    await onDisablePlan(parseInt(togglePlanId))
    setTogglePlanId('')
  }

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      <p className="admin-info">
        Connected as owner: <span className="address">{owner?.slice(0, 6)}...{owner?.slice(-4)}</span>
      </p>

      {error && <div className="error">{error}</div>}

      <section className="admin-section">
        <h3>Create New Plan</h3>
        <form onSubmit={handleCreatePlan} className="admin-form">
          <div className="form-group">
            <label>Tenor (days)</label>
            <input
              type="number"
              value={tenorDays}
              onChange={e => setTenorDays(e.target.value)}
              placeholder="e.g., 30"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>APR (%)</label>
            <input
              type="number"
              step="0.01"
              value={aprPercent}
              onChange={e => setAprPercent(e.target.value)}
              placeholder="e.g., 10 for 10%"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Min Deposit (USDC)</label>
            <input
              type="number"
              value={minDeposit}
              onChange={e => setMinDeposit(e.target.value)}
              placeholder="e.g., 100"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Max Deposit (USDC)</label>
            <input
              type="number"
              value={maxDeposit}
              onChange={e => setMaxDeposit(e.target.value)}
              placeholder="e.g., 10000"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Penalty (%)</label>
            <input
              type="number"
              step="0.01"
              value={penaltyPercent}
              onChange={e => setPenaltyPercent(e.target.value)}
              placeholder="e.g., 5 for 5%"
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Plan'}
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h3>Update Plan APR</h3>
        <form onSubmit={handleUpdatePlan} className="admin-form">
          <div className="form-group">
            <label>Plan ID</label>
            <input
              type="number"
              value={updatePlanId}
              onChange={e => setUpdatePlanId(e.target.value)}
              placeholder="e.g., 1"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>New APR (%)</label>
            <input
              type="number"
              step="0.01"
              value={newAprPercent}
              onChange={e => setNewAprPercent(e.target.value)}
              placeholder="e.g., 15 for 15%"
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-secondary" disabled={loading}>
            {loading ? 'Updating...' : 'Update APR'}
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h3>Enable/Disable Plan</h3>
        <div className="admin-form">
          <div className="form-group">
            <label>Plan ID</label>
            <input
              type="number"
              value={togglePlanId}
              onChange={e => setTogglePlanId(e.target.value)}
              placeholder="e.g., 1"
              disabled={loading}
            />
          </div>
          <div className="button-group">
            <button className="btn-primary" onClick={handleEnablePlan} disabled={loading || !togglePlanId}>
              {loading ? 'Processing...' : 'Enable Plan'}
            </button>
            <button className="btn-danger" onClick={handleDisablePlan} disabled={loading || !togglePlanId}>
              {loading ? 'Processing...' : 'Disable Plan'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
