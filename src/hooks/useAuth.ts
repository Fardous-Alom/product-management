import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

export const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated();
      if (isAuthenticated) {
        const token = localStorage.getItem('authToken');
        setUser({ email: 'user@example.com' });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    try {
      await authService.login(email);
      setUser({ email });
      navigate('/products');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/auth');
    window.dispatchEvent(new Event('storage'));
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
