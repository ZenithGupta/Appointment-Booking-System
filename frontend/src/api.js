// api.js - API configuration and service functions
import axios from 'axios';

// API Base Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🔍 Axios request config:', config); // Debug the full request
    console.log('🔍 Request data:', config.data); // Debug the request body
    console.log('🔍 Request headers:', config.headers); // Debug headers
    
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      // Create unique username to avoid conflicts
      const timestamp = Date.now();
      const registrationData = {
        username: `${userData.mobileNumber}_${timestamp}`, // Make username unique
        email: userData.email, // Use user-provided email
        password: userData.password, // Use user-provided password
        first_name: userData.name.split(' ')[0] || userData.name,
        last_name: userData.name.split(' ').slice(1).join(' ') || '',
      };

      console.log('🚀 Sending registration data:', registrationData);

      const response = await api.post('/register/', registrationData);

      console.log('✅ Registration successful:', response.data);

      const { access, refresh, user } = response.data;
      setTokens(access, refresh);
      
      // Store user data
      localStorage.setItem('user_data', JSON.stringify({
        ...user,
        name: userData.name,
        email: userData.email,
        dateOfBirth: userData.dateOfBirth,
        mobileNumber: userData.mobileNumber,
      }));

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      
      // Extract specific error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.username) {
          errorMessage = `Username error: ${errorData.username[0]}`;
        } else if (errorData.email) {
          errorMessage = `Email error: ${errorData.email[0]}`;
        } else if (errorData.password) {
          errorMessage = `Password error: ${errorData.password[0]}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Login existing user
  login: async (userData) => {
    try {
      const loginData = {
        username: userData.email, // Use email as username for login
        password: userData.password,
      };

      console.log('🚀 Attempting login with email:', userData.email);

      const response = await api.post('/login/', loginData);

      console.log('✅ Login successful:', response.data);

      const { access, refresh } = response.data;
      setTokens(access, refresh);

      // Store user data
      localStorage.setItem('user_data', JSON.stringify({
        ...response.data,
        name: response.data.first_name + ' ' + response.data.last_name,
        email: userData.email,
      }));

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error data:', error.response?.data);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.post('/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      clearTokens();
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/profile/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get profile',
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  },

  // Get stored user data
  getUserData: () => {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },
};

// Doctors API calls
export const doctorsAPI = {
  // Get all doctors
  getAll: async () => {
    try {
      const response = await api.get('/doctors/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch doctors',
      };
    }
  },

  // Get doctors by specialty
  getBySpecialty: async (specialtyId) => {
    try {
      const response = await api.get(`/doctors/by-specialty/${specialtyId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch doctors by specialty',
      };
    }
  },

  // Get doctor details
  getById: async (doctorId) => {
    try {
      const response = await api.get(`/doctors/${doctorId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch doctor details',
      };
    }
  },

  // Get available slots for doctor
  getAvailableSlots: async (doctorId) => {
    try {
      const response = await api.get(`/doctors/${doctorId}/available-slots/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch available slots',
      };
    }
  },
};

// Specialties API calls
export const specialtiesAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/specialties/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch specialties',
      };
    }
  },
};

// Appointments API calls
export const appointmentsAPI = {
  // Get user's appointments
  getMyAppointments: async () => {
    try {
      const response = await api.get('/appointment/my-appointments/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch appointments',
      };
    }
  },

  // Book appointment
  book: async (doctorId, appointmentData) => {
    try {
      const response = await api.post(`/appointment/book/${doctorId}/`, appointmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to book appointment',
      };
    }
  },

  // Cancel appointment
  cancel: async (appointmentId) => {
    try {
      const response = await api.post(`/appointment/cancel/${appointmentId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel appointment',
      };
    }
  },
};

export default api;