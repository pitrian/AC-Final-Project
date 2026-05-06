import { useState, useMemo } from 'react'
import { formatUnits } from 'ethers'
import ConnectWallet from './components/ConnectWallet'
import PlanList from './components/PlanList'
import DepositForm from './components/DepositForm'
import MyDeposits from './components/MyDeposits'
import AdminPanel from './components/AdminPanel'
import { useWallet } from './hooks/useWallet'
import { useContracts } from './hooks/useContracts'
import type { SavingPlan } from './types'
import './styles/App.css'

function App() {
  const wallet = useWallet()
  const contracts = useContracts(wallet.signer, wallet.provider, wallet.chainId)

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
          {!contracts.owner ? (
            <div className="loading">Loading admin status...</div>
          ) : (
            <>
              <div className="status-bar" style={{
                background: '#1a1a2e',
                border: '1px solid #2d2d44',
                borderRadius: '8px',
                padding: '8px 16px',
                margin: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#e0e0e0',
                flexWrap: 'wrap'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span style={{color: '#888'}}>Owner:</span>
                  <span style={{color: '#fff'}}>{contracts.owner ? `${contracts.owner.slice(0,6)}...${contracts.owner.slice(-4)}` : '...'}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span style={{color: '#888'}}>You:</span>
                  <span style={{color: '#fff'}}>{wallet.address ? `${wallet.address.slice(0,6)}...${wallet.address.slice(-4)}` : '...'}</span>
                </div>
                {contracts.owner?.toLowerCase() === wallet.address?.toLowerCase() ? (
                  <span style={{
                    background: '#065f46',
                    color: '#10b981',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: '1px solid #10b981'
                  }}>
                    ✅ Admin Mode
                  </span>
                ) : (
                  <span style={{
                    background: '#78350f',
                    color: '#fbbf24',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: '1px solid #fbbf24'
                  }}>
                    👤 User Mode
                  </span>
                )}
              </div>
              {contracts.owner?.toLowerCase() === wallet.address?.toLowerCase() ? (
                  <>
                  <div className="admin-badge">Admin Mode: {contracts.owner.slice(0, 6)}...{contracts.owner.slice(-4)}</div>
                  <AdminPanel
                    owner={contracts.owner}
                    onCreatePlan={contracts.createPlan}
                    onUpdatePlan={contracts.updatePlan}
                    onEnablePlan={contracts.enablePlan}
                    onDisablePlan={contracts.disablePlan}
                    onMintUSDC={contracts.mintUSDC}
                    onIncreaseTime={contracts.increaseTime}
                    loading={contracts.loading}
                    error={contracts.error}
                  />
                </>
              ) : (
                <>
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
                           onAutoRenew={contracts.autoRenewDeposit}
                           loading={contracts.loading}
                           error={contracts.error}
                           blockTimestamp={contracts.blockTimestamp}
                         />
                      </section>
                    </div>
                  )}
                </>
              )}
            </>
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
