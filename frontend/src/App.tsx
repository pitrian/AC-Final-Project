import { useState } from 'react'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import AdminPage from './pages/AdminPage'
import { useWallet } from './hooks/useWallet'
import { useContracts } from './hooks/useContracts'
import './styles/App.css'

function App() {
  const wallet = useWallet()
  const contracts = useContracts(wallet.signer, wallet.provider, wallet.chainId)
  
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  const isOwner = wallet.address && contracts.owner && 
    wallet.address.toLowerCase() === contracts.owner.toLowerCase()

  const renderPage = () => {
    if (!wallet.isConnected) {
      return (
        <HomePage 
          onNavigate={setCurrentPage} 
          onConnect={wallet.connect}
          isConnected={false}
        />
      )
    }

    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            onNavigate={setCurrentPage} 
            onConnect={wallet.connect}
            isConnected={wallet.isConnected}
          />
        )
      case 'products':
        return (
          <ProductsPage
            plans={contracts.plans}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onOpenDeposit={contracts.openDeposit}
            usdcBalance={contracts.usdcBalance}
            loading={contracts.loading}
          />
        )
      case 'dashboard':
        if (isOwner) {
          return (
            <AdminPage
              owner={contracts.owner}
              plans={contracts.plans}
              blockTimestamp={contracts.blockTimestamp}
              onCreatePlan={contracts.createPlan}
              onUpdatePlan={contracts.updatePlan}
              onEnablePlan={contracts.enablePlan}
              onDisablePlan={contracts.disablePlan}
              onMintUSDC={contracts.mintUSDC}
              onIncreaseTime={contracts.increaseTime}
              loading={contracts.loading}
              error={contracts.error}
            />
          )
        }
        return (
          <DashboardPage
            plans={contracts.plans}
            userDeposits={contracts.userDeposits}
            usdcBalance={contracts.usdcBalance}
            blockTimestamp={contracts.blockTimestamp}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onOpenDeposit={contracts.openDeposit}
            onWithdraw={contracts.withdraw}
            onEarlyWithdraw={contracts.earlyWithdraw}
            onRenewDeposit={contracts.renewDeposit}
            loading={contracts.loading}
            error={contracts.error}
          />
        )
      case 'about':
        return <AboutPage />
      case 'contact':
        return <ContactPage />
      default:
        return (
          <HomePage 
            onNavigate={setCurrentPage} 
            onConnect={wallet.connect}
            isConnected={wallet.isConnected}
          />
        )
    }
  }

  return (
    <div className="app">
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentChainId={wallet.chainId}
        onSwitchNetwork={wallet.switchNetwork}
        walletAddress={wallet.address}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
        isConnected={wallet.isConnected}
      />

      <main className="main-content">
        {renderPage()}
      </main>

      <Footer onNavigate={setCurrentPage} />
    </div>
  )
}

export default App