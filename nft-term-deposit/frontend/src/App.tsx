import { useState, useMemo } from 'react'
import { formatUnits } from 'ethers'
import ConnectWallet from './components/ConnectWallet'
import PlanList from './components/PlanList'
import DepositForm from './components/DepositForm'
import MyDeposits from './components/MyDeposits'
import { useWallet } from './hooks/useWallet'
import { useContracts } from './hooks/useContracts'
import type { SavingPlan } from './types'
import './styles/App.css'

function App() {
  const wallet = useWallet()
  const contracts = useContracts(wallet.signer, wallet.provider)

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'plans' | 'deposits'>('plans')

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return null
    return contracts.plans.find(p => Number(p.planId) === selectedPlanId) || null
  }, [selectedPlanId, contracts.plans])

  const plansMap = useMemo(() => {
    const map: { [key: number]: SavingPlan } = {}
    contracts.plans.forEach(p => {
      map[Number(p.planId)] = p
    })
    return map
  }, [contracts.plans])

  return (
    <div className="app">
      <header className="header">
        <h1>NFT Term Deposit</h1>
        <ConnectWallet
          address={wallet.address}
          balance={wallet.balance}
          usdcBalance={contracts.usdcBalance}
          isConnected={wallet.isConnected}
          isConnecting={wallet.isConnecting}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
      </header>

      {wallet.isConnected && (
        <main className="main">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              Plans
            </button>
            <button
              className={`tab ${activeTab === 'deposits' ? 'active' : ''}`}
              onClick={() => setActiveTab('deposits')}
            >
              My Deposits
            </button>
          </div>

          {activeTab === 'plans' && (
            <div className="tab-content">
              <section className="section">
                <h2>Available Plans</h2>
                <PlanList
                  plans={contracts.plans}
                  onSelectPlan={setSelectedPlanId}
                  selectedPlanId={selectedPlanId}
                />
              </section>

              {selectedPlan && (
                <section className="section">
                  <DepositForm
                    selectedPlanId={selectedPlanId}
                    planTenorDays={Number(selectedPlan.tenorDays)}
                    planMinDeposit={Number(formatUnits(selectedPlan.minDeposit, 6))}
                    planMaxDeposit={Number(formatUnits(selectedPlan.maxDeposit, 6))}
                    usdcBalance={contracts.usdcBalance}
                    onDeposit={contracts.openDeposit}
                    loading={contracts.loading}
                    error={contracts.error}
                  />
                </section>
              )}
            </div>
          )}

          {activeTab === 'deposits' && (
            <div className="tab-content">
              <section className="section">
                <h2>My Deposits</h2>
                <MyDeposits
                  deposits={contracts.userDeposits}
                  plans={plansMap}
                  onWithdraw={contracts.withdraw}
                  onEarlyWithdraw={contracts.earlyWithdraw}
                  onRenew={contracts.renewDeposit}
                  loading={contracts.loading}
                  error={contracts.error}
                />
              </section>
            </div>
          )}
        </main>
      )}

      <footer className="footer">
        <p>NFT-Powered Term Deposit Protocol | Demo</p>
      </footer>
    </div>
  )
}

export default App
