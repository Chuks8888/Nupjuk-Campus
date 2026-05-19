import { GraduationCap } from 'lucide-react';

export default function AuthForm({ title, onSubmit, error, children, footer }) {
  return (
    <div className="login-container">
      <div className="login-header" style={{ textAlign: 'center' }}>
        <GraduationCap size={48} color="#007AFF" style={{ marginBottom: '1rem' }} />
        <h2>Nupjuk Campus</h2>
        <p>{title}</p>
      </div>
      
      <form className="login-form" onSubmit={onSubmit}>
        {children}
        
        {error && <p className="error-message" style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
      </form>

      {footer && <div style={{ marginTop: '1rem', textAlign: 'center' }}>{footer}</div>}
    </div>
  );
}