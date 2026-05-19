import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, MailCheck } from 'lucide-react';
import AuthForm from '../components/auth/AuthForm';
import InputField from '../components/auth/InputField';
import SubmitButton from '../components/auth/SubmitButton';
import '../styles/Login.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.endsWith('@kaist.ac.kr')) {
      setError('Registration is restricted to valid @kaist.ac.kr email addresses.');
      return;
    }

    if (confirmPassword !== password){
      setError('The passwords do not match')
      return;
    }

    // MOCK REST API CALL:
    // Await fetch('/api/register', {...})
    
    // On success, flip the view to the verification message
    setIsSubmitted(true);
  };

  // If registration is successful, render the success UI
  if (isSubmitted) {
    return (
      <div className="login-container" style={{ textAlign: 'center', padding: '2rem' }}>
        <MailCheck size={64} color="#34C759" style={{ marginBottom: '1rem' }} />
        <h2>Check Your Inbox</h2>
        <p style={{ margin: '1rem 0', lineHeight: '1.5' }}>
          We've sent a verification link to <strong>{email}</strong>. 
          Please click the link in the email to activate your account.
        </p>
        <Link to="/login" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: 'bold' }}>
          Return to Login
        </Link>
      </div>
    );
  }

  const footer = (
    <p style={{ fontSize: '0.9rem' }}>
      Already have an account? <Link to="/login" style={{ color: '#007AFF', textDecoration: 'none' }}>Log in</Link>
    </p>
  );

  return (
    <div className="auth-page">
      <div className="login-container">
      <AuthForm 
        title="Create your student account" 
        onSubmit={handleRegister} 
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
        <InputField  
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          placeholder="confirm password"
        />
        <SubmitButton text="REGISTER" icon={UserPlus} />
      </AuthForm>
      </div>
    </div>
  );
}