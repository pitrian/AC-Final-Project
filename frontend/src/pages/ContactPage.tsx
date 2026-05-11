import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you</p>
      </div>

      <div className="about-section">
        <div className="features-grid" style={{ marginBottom: 48 }}>
          <div className="feature-card">
            <div className="feature-icon">📧</div>
            <h3>Email</h3>
            <p>support@nftbank.com</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Discord</h3>
            <p>Join our community</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🐦</div>
            <h3>Twitter</h3>
            <p>Follow for updates</p>
          </div>
        </div>
      </div>

      <div className="contact-form">
        <h2 style={{ marginBottom: 24 }}>Send us a Message</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            >
              <option value="">Select a topic</option>
              <option value="general">General Inquiry</option>
              <option value="support">Technical Support</option>
              <option value="partnership">Partnership</option>
              <option value="careers">Careers</option>
            </select>
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              placeholder="Your message here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}