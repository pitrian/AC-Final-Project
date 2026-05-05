interface ConnectWalletProps {
  address: string | null
  balance: string
  usdcBalance: string
  isConnected: boolean
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export default function ConnectWallet({
  address,
  balance,
  usdcBalance,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: ConnectWalletProps) {
  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <span className="address">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <span className="balance">{parseFloat(balance).toFixed(4)} ETH</span>
          <span className="balance">{parseFloat(usdcBalance).toFixed(2)} USDC</span>
        </div>
        <button className="btn-danger" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button className="btn-primary" onClick={onConnect} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
    </button>
  )
}
