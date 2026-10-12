import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext';
import LoadingSpinner from './ui/LoadingSpinner';

export const PrivateRoute = ({ children }) => {
  const { loggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return loggedIn ? children : <Navigate to={"/login"} />;
}