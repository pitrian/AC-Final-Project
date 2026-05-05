import { formatUnits } from 'ethers'
import type { SavingPlan } from '../types'

interface PlanListProps {
  plans: SavingPlan[]
  onSelectPlan: (planId: number) => void
  selectedPlanId: number | null
}

export default function PlanList({ plans, onSelectPlan, selectedPlanId }: PlanListProps) {
  if (plans.length === 0) {
    return <div className="empty-state">No plans available</div>
  }

  return (
    <div className="plans-grid">
      {plans.map(plan => {
        const aprPercent = Number(formatUnits(plan.aprBps, 2))
        const penaltyPercent = Number(formatUnits(plan.penaltyBps, 2))
        const minDeposit = Number(formatUnits(plan.minDeposit, 6))
        const maxDeposit = Number(formatUnits(plan.maxDeposit, 6))
        const isSelected = selectedPlanId === Number(plan.planId)

        return (
          <div
            key={Number(plan.planId)}
            className={`plan-card ${isSelected ? 'selected' : ''} ${!plan.enabled ? 'disabled' : ''}`}
            onClick={() => plan.enabled && onSelectPlan(Number(plan.planId))}
            style={{ cursor: plan.enabled ? 'pointer' : 'default' }}
          >
            <div className="plan-header">
              <h3>Plan #{Number(plan.planId)}</h3>
              <span className={`badge ${plan.enabled ? 'badge-active' : 'badge-inactive'}`}>
                {plan.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="plan-details">
              <div className="plan-detail">
                <span className="label">Tenor</span>
                <span className="value">{Number(plan.tenorDays)} days</span>
              </div>
              <div className="plan-detail">
                <span className="label">APR</span>
                <span className="value highlight">{aprPercent.toFixed(2)}%</span>
              </div>
              <div className="plan-detail">
                <span className="label">Min Deposit</span>
                <span className="value">{minDeposit.toLocaleString()} USDC</span>
              </div>
              <div className="plan-detail">
                <span className="label">Max Deposit</span>
                <span className="value">{maxDeposit.toLocaleString()} USDC</span>
              </div>
              <div className="plan-detail">
                <span className="label">Early Penalty</span>
                <span className="value warning">{penaltyPercent.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
