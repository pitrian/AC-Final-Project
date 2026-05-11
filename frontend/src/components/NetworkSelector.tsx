import { NETWORKS } from '../config/networks'

interface NetworkSelectorProps {
  currentChainId: number | null
  onSwitchNetwork: (chainId: number) => Promise<boolean>
}

export default function NetworkSelector({ currentChainId, onSwitchNetwork }: NetworkSelectorProps) {
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chainId = parseInt(e.target.value)
    await onSwitchNetwork(chainId)
  }

  return (
    <div className="network-selector">
      <label>Network: </label>
      <select 
        value={currentChainId || ''} 
        onChange={handleChange}
        className="network-select"
      >
        <option value="" disabled>Select Network</option>
        {Object.values(NETWORKS).map((network) => (
          <option 
            key={network.chainId} 
            value={network.chainId}
            selected={network.chainId === currentChainId}
          >
            {network.name}
          </option>
        ))}
      </select>
    </div>
  )
}