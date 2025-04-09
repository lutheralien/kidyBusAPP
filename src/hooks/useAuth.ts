// src/hooks/useAuth.ts
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, signupUser, logoutUser, clearCredentials } from '../store/slices/authSlice';
import { reset } from '../navigation/NavigationService';
import { ROUTES } from '../constants/routes';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, role, status, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  // Login function
  const login = useCallback(
    async (phone: string, password: string, userType: "DRIVER" | "PARENT") => {
      try {
        const result = await dispatch(loginUser({ phone, password, userType })).unwrap();
        return { success: true, data: result };
      } catch (error: any) {
        console.log('Login error caught in useAuth:', error);
        
        // The error from Redux might be in different formats depending on how rejectWithValue was called
        // Let's ensure we have a consistent format
        return { 
          success: false, 
          message: error.message || error.error || (typeof error === 'string' ? error : 'Login failed'),
          code: error.code || error.status || 'UNKNOWN_ERROR'
        };
      }
    },
    [dispatch]
  );

  // Signup function
  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        await dispatch(signupUser({ name, email, password })).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(clearCredentials());
      return true;
    } catch (error) {
      return false;
    }
  }, [dispatch]);

  // Check if user has admin role
  const isAdmin = useCallback(() => role === 'admin', [role]);

  return {
    user,
    token,
    role,
    status,
    error,
    isAuthenticated,
    isAdmin,
    login,
    signup,
    logout,
  };
};

export default useAuth;