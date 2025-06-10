// api.js - Fixed version with proper token handling
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

// Token management with validation
const getAccessToken = () => {
  const token = localStorage.getItem('access_token');
  // Return null if token is invalid/empty
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return null;
  }
  return token;
};

const getRefreshToken = () => {
  const token = localStorage.getItem('refresh_token');
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return null;
  }
  return token;
};

const setTokens = (accessToken, refreshToken) => {
  if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
  }
  if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
};

// Request interceptor to add auth token ONLY if valid
api.interceptors.request.use(
  (config) => {
    console.log('🔍 Making API request to:', config.url);
    
    const token = getAccessToken();
    
    // ONLY add Authorization header if we have a valid token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added valid token to request');
    } else {
      // Make sure no Authorization header is sent for public endpoints
      delete config.headers.Authorization;
      console.log('🔓 No token - making public request');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('✅ API response received:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API error:', error.response?.status, error.response?.data);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('🔄 Attempting token refresh...');

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          console.log('✅ Token refreshed successfully');

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          console.log('❌ No refresh token available');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Refresh failed, clear tokens and let the user re-login
        clearTokens();
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API calls (updated with better error handling)
export const authAPI = {
  // Register new user (updated to include mobile number)
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
        mobile_number: userData.mobileNumber, // Add mobile number
        date_of_birth: userData.dateOfBirth
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

  // Login existing user (email-based)
  login: async (userData) => {
    try {
      const loginData = {
        email: userData.email,
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
        loginMethod: 'email'
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

  // NEW: Send OTP for mobile login
  sendOTP: async (mobileNumber) => {
    try {
      console.log('📱 Sending OTP to:', mobileNumber);

      const response = await api.post('/send-otp/', {
        mobile_number: mobileNumber
      });

      console.log('✅ OTP sent successfully:', response.data);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // NEW: Verify OTP and login
  verifyOTPLogin: async (mobileNumber, otp) => {
    try {
      console.log('🔐 Verifying OTP for mobile:', mobileNumber);

      const response = await api.post('/verify-otp-login/', {
        mobile_number: mobileNumber,
        otp: otp
      });

      console.log('✅ OTP verification successful:', response.data);

      const { access, refresh } = response.data;
      setTokens(access, refresh);

      // Store user data
      localStorage.setItem('user_data', JSON.stringify({
        ...response.data,
        name: response.data.first_name + ' ' + response.data.last_name,
        mobileNumber: mobileNumber,
        loginMethod: 'mobile'
      }));

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      
      let errorMessage = 'OTP verification failed. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
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

export const doctorsAPI = {
  // Get all doctors with pagination
  getAll: async (page = 1, pageSize = 10) => {
    try {
      const response = await api.get('/doctors/', {
        params: {
          page,
          page_size: pageSize
        }
      });
      
      // Return both results and pagination info
      return { 
        success: true, 
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          total_pages: Math.ceil(response.data.count / pageSize),
          current_page: page,
          page_size: pageSize
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch doctors',
      };
    }
  },

  // UPDATED: Get doctors by specialty with proper pagination
  getBySpecialty: async (specialtyId, page = 1, pageSize = 10) => {
    try {
      console.log(`🔍 Fetching doctors for specialty ${specialtyId}, page ${page}, pageSize ${pageSize}`);
      
      const response = await api.get(`/doctors/by-specialty/${specialtyId}/`, {
        params: {
          page,
          page_size: pageSize
        }
      });
      
      console.log('📋 Specialty API response:', response.data);
      
      // Handle paginated response (this should be the standard now)
      if (response.data.results !== undefined) {
        // Paginated response
        return { 
          success: true, 
          data: response.data.results,
          pagination: {
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous,
            total_pages: Math.ceil(response.data.count / pageSize),
            current_page: page,
            page_size: pageSize
          }
        };
      } else {
        // Fallback for non-paginated response (shouldn't happen with new backend)
        console.warn('⚠️ Received non-paginated response for specialty filter');
        const results = Array.isArray(response.data) ? response.data : [response.data];
        return { 
          success: true, 
          data: results,
          pagination: {
            count: results.length,
            next: null,
            previous: null,
            total_pages: Math.ceil(results.length / pageSize),
            current_page: 1,
            page_size: pageSize
          }
        };
      }
    } catch (error) {
      console.error('❌ Error fetching doctors by specialty:', error);
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
      console.error('❌ Error loading specialties:', error);
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
      console.error('❌ Error loading appointments:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch appointments',
      };
    }
  },

  // Enhanced book appointment with better error handling
  book: async (doctorId, appointmentData) => {
    try {
      const response = await api.post(`/appointment/book/${doctorId}/`, appointmentData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Booking error details:', error.response);
      
      let errorDetails = 'Failed to book appointment';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle specific error codes from backend
        if (errorData.error_code) {
          return {
            success: false,
            error: {
              message: errorData.error || errorData.message,
              error_code: errorData.error_code
            }
          };
        }
        
        // Handle general error messages
        if (errorData.message) {
          errorDetails = errorData.message;
        } else if (errorData.error) {
          errorDetails = errorData.error;
        } else if (typeof errorData === 'string') {
          errorDetails = errorData;
        }
      }
      
      return {
        success: false,
        error: errorDetails,
      };
    }
  },

  // Cancel appointment
  cancel: async (appointmentId) => {
    try {
      const response = await api.post(`/appointment/cancel/${appointmentId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error canceling appointment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to cancel appointment',
      };
    }
  },
};

export default api;