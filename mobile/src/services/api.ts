import axios from 'axios';
import Constants from 'expo-constants';

// Get the backend URL from environment or use default
const BACKEND_URL = 'http://localhost:5000';
console.log('Backend URL configured as:', BACKEND_URL);

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Token will be added by AuthContext
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
    console.error('Error Config:', error.config?.url);
    
    // Log detailed validation errors
    if (error.response?.data?.details) {
      console.error('🔍 VALIDATION DETAILS:', error.response.data.details);
      if (Array.isArray(error.response.data.details)) {
        error.response.data.details.forEach((detail: string, index: number) => {
          console.error(`❌ Validation Error ${index + 1}:`, detail);
        });
      } else {
        console.error('❌ Details is not an array:', typeof error.response.data.details);
      }
    } else {
      console.error('❌ No details found in error response');
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access, redirecting to login');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/api/users/login', { email, password }),
  
  register: (userData: any) => 
    api.post('/api/users/register', userData),
  
  getProfile: () => 
    api.get('/api/users/profile'),
  
  updateProfile: (profileData: any) => 
    api.put('/api/users/profile', profileData),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    api.put('/api/users/change-password', { currentPassword, newPassword }),
};

export const scriptsAPI = {
  upload: (formData: FormData) => 
    api.post('/api/scripts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getAll: (params?: any) => 
    api.get('/api/scripts', { params }),
  
  getById: (id: string) => 
    api.get(`/api/scripts/${id}`),
  
  delete: (id: string) => 
    api.delete(`/api/scripts/${id}`),
  
  getStats: () => 
    api.get('/api/scripts/stats'),
};

export const markingAPI = {
  getMarking: (scriptId: string) => 
    api.get(`/api/marking/${scriptId}`),
  
  updateQuestion: (scriptId: string, questionNumber: number, data: any) => 
    api.put(`/api/marking/${scriptId}/questions/${questionNumber}`, data),
  
  submitMarking: (scriptId: string) => 
    api.post(`/api/marking/${scriptId}/submit`),
  
  getStats: () => 
    api.get('/api/marking/stats'),
  
  getSampleRubrics: () => 
    api.get('/api/marking/sample-rubrics'),
}; 