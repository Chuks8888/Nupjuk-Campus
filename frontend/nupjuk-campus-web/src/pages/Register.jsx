import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, MailCheck } from 'lucide-react';
import AuthForm from '../components/auth/AuthForm';
import InputField from '../components/auth/InputField';
import SubmitButton from '../components/auth/SubmitButton';
import { sendVerificationCode, signup } from '../api/auth';
import '../styles/Login.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    
    if (!email.endsWith('@kaist.ac.kr')) {
      setError('Registration is restricted to valid @kaist.ac.kr email addresses.');
      return;
    }

    if (confirmPassword !== password){
      setError('The passwords do not match')
      return;
    }

    try {
      setIsSubmitting(true);

      if (!isCodeSent) {
        await sendVerificationCode(email);
        setIsCodeSent(true);
        setStatusMessage(`Verification code sent to ${email}.`);
        return;
      }

      if (!code.trim()) {
        setError('Please enter the verification code.');
        return;
      }

      await signup({ email, password, code: code.trim() });
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If registration is successful, render the success UI
  if (isSubmitted) {
    return (
      <div className="login-container" style={{ textAlign: 'center', padding: '2rem' }}>
        <MailCheck size={64} color="#34C759" style={{ marginBottom: '1rem' }} />
        <h2>Check Your Inbox</h2>
        <p style={{ margin: '1rem 0', lineHeight: '1.5' }}>
          Your account for <strong>{email}</strong> has been created.
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
        {statusMessage && (
          <p style={{ color: '#34C759', fontSize: '0.875rem', margin: 0 }}>{statusMessage}</p>
        )}
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
        {isCodeSent && (
          <InputField
            label="Verification Code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
          />
        )}
        <SubmitButton
          text={isSubmitting ? 'PLEASE WAIT...' : isCodeSent ? 'CREATE ACCOUNT' : 'SEND VERIFICATION CODE'}
          icon={UserPlus}
          disabled={isSubmitting}
        />
      </AuthForm>
      </div>
    </div>
  );
}
