interface FooterProps {
  onNavigate: (page: string) => void
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand-section">
          <div className="footer-brand">
            <div className="footer-brand-icon">🏦</div>
            <span>NFT Bank</span>
          </div>
          <p className="footer-desc">
            The next generation of decentralized banking. Secure, transparent, 
            and accessible to everyone.
          </p>
        </div>

        <div className="footer-column">
          <h4>Platform</h4>
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('products') }}>Products</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard') }}>Dashboard</a></li>
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Company</h4>
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('about') }}>About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('contact') }}>Contact</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
            <li><a href="#">Disclaimer</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 NFT Bank. All rights reserved.</p>
      </div>
    </footer>
  )
}