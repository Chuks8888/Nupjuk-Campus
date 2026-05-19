import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {

    const isAuthenticated = true; 

    // const token = localStorage.getItem('authToken');
    // const isAuthenticated = !!token; // Converts the token string to a boolean

    // If the user is NOT authenticated, kick them back to the login page.
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;