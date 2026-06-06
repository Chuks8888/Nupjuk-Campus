import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { clearSession, getCurrentUser, hasSession } from '../api/auth';

const ProtectedRoute = () => {
  const [authState, setAuthState] = useState(() => (hasSession() ? 'checking' : 'guest'));

  useEffect(() => {
    if (authState !== 'checking') return undefined;

    let isMounted = true;

    getCurrentUser()
      .then(() => {
        if (isMounted) setAuthState('authenticated');
      })
      .catch(() => {
        clearSession();
        if (isMounted) setAuthState('guest');
      });

    return () => {
      isMounted = false;
    };
  }, [authState]);

  if (authState === 'checking') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Checking session...</div>;
  }

  if (authState === 'guest') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
