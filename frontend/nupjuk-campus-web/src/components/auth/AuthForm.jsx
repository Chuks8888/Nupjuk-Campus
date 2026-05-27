import { GraduationCap } from 'lucide-react';
import '../../styles/Login.css';

export default function AuthForm({ title, onSubmit, error, children, footer }) {
  return (
    <div className="login-container">
      <div className="login-header">
        <GraduationCap size={48} style={{ color: 'var(--brand-blue)', marginBottom: '1rem' }} />
        <h2>Nupjuk Campus</h2>
        <p>{title}</p>
      </div>

      <form className="login-form" onSubmit={onSubmit}>
        {children}
        {error && <p className="error-message">{error}</p>}
      </form>

      {footer && <div className="auth-footer-container">{footer}</div>}
    </div>
  );
}
