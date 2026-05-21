import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthForm from '../components/auth/AuthForm';
import InputField from '../components/auth/InputField';
import SubmitButton from '../components/auth/SubmitButton';
import { login, storeSession } from '../api/auth';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.endsWith('@kaist.ac.kr')) {
      setError('Please use a valid @kaist.ac.kr email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const session = await login({ email, password });
      storeSession(session);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
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
        <SubmitButton text={isSubmitting ? 'LOGGING IN...' : 'LOGIN'} icon={LogIn} disabled={isSubmitting} />
      </AuthForm>
      </div>
    </div>
  );
}
