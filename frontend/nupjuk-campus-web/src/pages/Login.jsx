import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn } from 'lucide-react';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!email.endsWith('@kaist.ac.kr')) {
      setError('Please use a valid @kaist.ac.kr email address.');
      return;
    }
    

    // For now, bypass actual auth and go straight to Home
    navigate('/home');

  };

  return (
    <div className="login-container">
      <div className="login-header" style={{ textAlign: 'center' }}>
        <GraduationCap size={48} color="#007AFF" style={{ marginBottom: '1rem' }} />
        <h2>Nupjuk Campus</h2>
        <p>Course Community & Schedule Management for KAIST</p>
      </div>
      
      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-group">
          <label>KAIST Email</label>
          <input 
            type="email" 
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@kaist.ac.kr"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="login-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <LogIn size={18} />
          LOGIN
        </button>
      </form>
    </div>
  );
}