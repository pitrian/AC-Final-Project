import { NETWORKS } from '../config/networks'

interface NavigationProps {
  currentPage: string
  onNavigate: (page: string) => void
  currentChainId: number | null
  onSwitchNetwork: (chainId: number) => Promise<boolean>
  walletAddress: string | null
  onConnect: () => void
  onDisconnect: () => void
  isConnected: boolean
}

export default function Navigation({
  currentPage,
  onNavigate,
  currentChainId,
  onSwitchNetwork,
  walletAddress,
  onConnect,
  onDisconnect,
  isConnected
}: NavigationProps) {
  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => onNavigate('home')}>
        <div className="navbar-logo-icon">🏦</div>
        <span>NFT Bank</span>
      </div>

      <div className="navbar-menu">
        <a 
          className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          Home
        </a>
        <a 
          className={`nav-link ${currentPage === 'products' ? 'active' : ''}`}
          onClick={() => onNavigate('products')}
        >
          Products
        </a>
        <a 
          className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          Dashboard
        </a>
        <a 
          className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
          onClick={() => onNavigate('about')}
        >
          About
        </a>
        <a 
          className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`}
          onClick={() => onNavigate('contact')}
        >
          Contact
        </a>
      </div>

      <div className="navbar-right">
        <div className="nav-network">
          <span>🌐</span>
          <select 
            value={currentChainId || 31337}
            onChange={(e) => onSwitchNetwork(parseInt(e.target.value))}
          >
            {Object.values(NETWORKS).map((network) => (
              <option key={network.chainId} value={network.chainId}>
                {network.name}
              </option>
            ))}
          </select>
        </div>

        {isConnected ? (
          <div className="wallet-info">
            <span className="wallet-address">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </span>
            <button className="btn btn-secondary" onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="wallet-btn" onClick={onConnect}>
            <span>🔗</span>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  )
}