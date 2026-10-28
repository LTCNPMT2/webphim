import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

// const { user, isAdmin, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}
