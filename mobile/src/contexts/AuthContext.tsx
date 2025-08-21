import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'admin';
  subjects: string[];
  department?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'teacher' | 'admin';
  subjects?: string[];
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = Platform.OS === 'web' 
        ? await AsyncStorage.getItem('auth_token')
        : await SecureStore.getItemAsync('auth_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email, password: '***' });
      console.log('Backend URL:', api.defaults.baseURL);
      
      const response = await api.post('/api/users/login', { email, password });
      console.log('Login response:', response.data);
      
      const { token, user: userData } = response.data;

      // Store token based on platform
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem('auth_token', token);
      } else {
        await SecureStore.setItemAsync('auth_token', token);
      }
      
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    } catch (error: unknown) {
      console.error('Login error:', error);
      console.error('Error response:', (error as any)?.response?.data);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      const responseError = (error as any)?.response?.data?.error;
      throw new Error(responseError || errorMessage);
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      console.log('Attempting signup with:', { ...userData, password: '***' });
      console.log('Backend URL:', api.defaults.baseURL);
      
      const response = await api.post('/api/users/register', userData);
      console.log('Signup response:', response.data);
      
      const { token, user: newUser } = response.data;

      // Store token based on platform
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem('auth_token', token);
      } else {
        await SecureStore.setItemAsync('auth_token', token);
      }
      
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(newUser);
    } catch (error: unknown) {
      console.error('Signup error:', error);
      console.error('Error response:', (error as any)?.response?.data);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      const responseError = (error as any)?.response?.data?.error;
      throw new Error(responseError || errorMessage);
    }
  };

  const logout = async () => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem('auth_token');
    } else {
      await SecureStore.deleteItemAsync('auth_token');
    }
    await AsyncStorage.removeItem('user_data');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 