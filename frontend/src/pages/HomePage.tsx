interface HomePageProps {
  onNavigate: (page: string) => void
  onConnect: () => void
  isConnected: boolean
}

export default function HomePage({ onNavigate, onConnect, isConnected }: HomePageProps) {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">✨ The Future of Savings</div>
          <h1>Secure Your Future with NFT Term Deposits</h1>
          <p>
            Experience next-generation banking with blockchain-powered term deposits. 
            Earn competitive interest rates with fully verified NFT certificates.
          </p>
          <div className="hero-buttons">
            {isConnected ? (
              <a className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
                Go to Dashboard
              </a>
            ) : (
              <button className="btn btn-primary" onClick={() => { console.log('Connect clicked'); onConnect() }}>
                Get Started
              </button>
            )}
            <a className="btn btn-outline" onClick={() => onNavigate('products')}>
              View Products
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Why Choose NFT Bank?</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Transparent</h3>
            <p>All deposits are blockchain-verified with complete transparency</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Competitive Rates</h3>
            <p>Earn up to 12% APY with our premium term deposit packages</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>NFT Certificates</h3>
            <p>Receive unique NFT certificates as proof of your deposit</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section">
        <div className="metrics-grid" style={{ marginBottom: 0 }}>
          <div className="metric-card">
            <div className="metric-icon balance">💰</div>
            <div className="metric-label">Total Deposited</div>
            <div className="metric-value">$2.5M+</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon deposits">📋</div>
            <div className="metric-label">Active Deposits</div>
            <div className="metric-value">1,200+</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon interest">📊</div>
            <div className="metric-label">Interest Earned</div>
            <div className="metric-value">$180K+</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon nfts">🎫</div>
            <div className="metric-label">NFTs Issued</div>
            <div className="metric-value">3,500+</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{ textAlign: 'center' }}>
        <h2 className="section-title">Ready to Start Earning?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}>
          Join thousands of smart savers who have already secured their financial future with NFT Bank.
        </p>
        <button className="btn btn-primary" onClick={isConnected ? () => onNavigate('dashboard') : onConnect}>
          {isConnected ? 'Go to Dashboard' : 'Connect Wallet Now'}
        </button>
      </section>
    </div>
  )
}