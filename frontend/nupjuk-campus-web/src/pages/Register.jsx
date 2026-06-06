import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, MailCheck } from 'lucide-react';
import { isValidKaistEmail } from '../utils/validator';
import AuthForm from '../components/auth/AuthForm';
import InputField from '../components/auth/InputField';
import SubmitButton from '../components/auth/SubmitButton';
import { sendVerificationCode, signup, storeSession } from '../api/auth';
import '../styles/Login.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [step, setStep] = useState('register'); // 'register' | 'verify' | 'success'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    if (!isValidKaistEmail(email)) {
      setError('Please use a valid @kaist.ac.kr email address.');
      return;
    }

    if (confirmPassword !== password) {
      setError('The passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);

      if (step === 'register') {
        await sendVerificationCode(email);
        setStep('verify');
        setStatusMessage(`Verification code sent to ${email}.`);
        return;
      }

      if (step === 'verify') {
        if (!code.trim()) throw new Error('Please enter the code.');

        const session = await signup({ email, password, code: code.trim() });
        storeSession(session);

        setStep('success');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If registration is successful, render the success UI
  if (step === 'success') {
    return (
      <div className="register-success-container">
        <MailCheck size={64} color="var(--success-text, #34C759)" />
        <h2>Congratulations!</h2>
        <p>
          Your account for <strong>{email}</strong> has been created.
        </p>
        <Link to="/login" className="auth-link" style={{ fontWeight: 'bold' }}>
          Return to Login
        </Link>
      </div>
    );
  }

  const footer = (
    <p className="auth-footer">
      Already have an account?{' '}
      <Link to="/login" style={{ color: '#007AFF', textDecoration: 'none' }}>
        Log in
      </Link>
    </p>
  );

  return (
    <div className="auth-page">
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
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {step === 'verify' && (
          <InputField
            label="Verification Code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            required={true}
          />
        )}
        <SubmitButton
          text={
            isSubmitting
              ? 'PLEASE WAIT...'
              : step === 'verify'
                ? 'CREATE ACCOUNT'
                : 'SEND VERIFICATION CODE'
          }
          icon={UserPlus}
          disabled={isSubmitting}
        />
      </AuthForm>
    </div>
  );
}
