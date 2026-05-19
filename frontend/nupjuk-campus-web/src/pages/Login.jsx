import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthForm from '../components/auth/AuthForm';
import InputField from '../components/auth/InputField';
import SubmitButton from '../components/auth/SubmitButton';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.endsWith('@kaist.ac.kr')) {
      setError('Please use a valid @kaist.ac.kr email address.');
      return;
    }

    // MOCK REST API CALL:
    // In the future, you will await fetch('/api/login', {...}) here.
    // For now, we simulate receiving a token and saving it.
    localStorage.setItem('authToken', 'mock_jwt_token_12345');
    navigate('/home');
  };

  const footer = (
    <p style={{ fontSize: '0.9rem' }}>
      New to Nupjuk Campus? <Link to="/register" style={{ color: '#007AFF', textDecoration: 'none' }}>Register here</Link>
    </p>
  );

  return (
    <div className="auth-page">
      <div className="login-container">
      <AuthForm 
        title="Course Community & Schedule Management" 
        onSubmit={handleLogin} 
        error={error}
        footer={footer}
      >
        <InputField 
          label="KAIST Email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="student@kaist.ac.kr" 
        />
        <InputField 
          label="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <SubmitButton text="LOGIN" icon={LogIn} />
      </AuthForm>
      </div>
    </div>
  );
}