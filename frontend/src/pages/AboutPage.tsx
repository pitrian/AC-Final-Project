export default function AboutPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>About NFT Bank</h1>
        <p>Pioneering the future of decentralized finance</p>
      </div>

      <div className="about-section">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800" 
          alt="Modern banking tower" 
          className="about-image"
        />
        <h2>Who We Are</h2>
        <p>
          NFT Bank is a revolutionary decentralized finance platform that combines the security 
          of traditional banking with the innovation of blockchain technology. We provide 
          term deposit solutions that offer competitive interest rates while giving you 
          complete control over your assets.
        </p>
      </div>

      <div className="about-section">
        <h2>Our Mission</h2>
        <p>
          Our mission is to democratize access to secure, transparent, and high-yield 
          savings products. By leveraging blockchain technology and NFT certificates, 
          we're creating a new standard for digital banking that benefits everyone.
        </p>
      </div>

      <div className="about-section">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Bank-Grade Security</h3>
            <p>Smart contracts audited and verified for maximum security</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Settlement</h3>
            <p>No waiting days - withdrawals processed immediately</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Access</h3>
            <p>Anyone with a wallet can access our services 24/7</p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>Technology</h2>
        <p>
          Built on Ethereum-compatible blockchain networks, our platform utilizes 
          ERC-721 tokens to create unique NFT certificates for each deposit. These 
          certificates serve as immutable proof of your deposit and can be transferred 
          or traded on compatible marketplaces.
        </p>
        <img 
          src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800" 
          alt="Blockchain technology" 
          className="about-image"
          style={{ marginTop: 24 }}
        />
      </div>

      <div className="about-section">
        <h2>Our Team</h2>
        <p>
          Founded by a team of blockchain experts and financial professionals, 
          NFT Bank brings together decades of experience in both traditional 
          finance and decentralized technologies. We're committed to building 
          the future of banking.
        </p>
      </div>
    </div>
  )
}