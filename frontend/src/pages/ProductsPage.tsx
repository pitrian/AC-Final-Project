import { useState } from 'react'
import { formatUnits } from 'ethers'
import type { SavingPlan } from '../types'

interface ProductsPageProps {
  plans: SavingPlan[]
  selectedPlanId: number | null
  onSelectPlan: (planId: number | null) => void
  onOpenDeposit: (planId: number, amount: string) => Promise<void>
  usdcBalance: string
  loading: boolean
}

export default function ProductsPage({
  plans,
  selectedPlanId,
  onSelectPlan,
  onOpenDeposit,
  usdcBalance,
  loading
}: ProductsPageProps) {
  const [depositAmount, setDepositAmount] = useState('')

  const handleDeposit = async () => {
    if (!selectedPlanId || !depositAmount) return
    await onOpenDeposit(selectedPlanId, depositAmount)
    setDepositAmount('')
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Our Savings Products</h1>
        <p>Choose the term deposit that fits your financial goals</p>
      </div>

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
            <div className="plan-action">
              <button 
                className="btn btn-primary"
                disabled={!plan.enabled}
                onClick={(e) => {
                  e.stopPropagation()
                  if (plan.enabled) onSelectPlan(Number(plan.planId))
                }}
              >
                Select Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPlanId && (
        <div className="deposit-form" style={{ marginTop: 48 }}>
          <h3>💰 Open Deposit - Plan #{selectedPlanId}</h3>
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
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <button 
              className="max-btn"
              onClick={() => setDepositAmount(usdcBalance)}
            >
              MAX
            </button>
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleDeposit}
            disabled={loading || !depositAmount}
          >
            {loading ? 'Processing...' : 'Confirm Deposit'}
          </button>
        </div>
      )}
    </div>
  )
}