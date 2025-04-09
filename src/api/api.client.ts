import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Extend the AxiosRequestConfig interface
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

const BASE_URL = 'http://192.168.1.49:3005/api/v1';
// Create axios instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    async (config) => {
        // Get token from storage
        const token = await AsyncStorage.getItem('token');

        // If token exists, add to headers
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: unknown) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: unknown) => {
        console.log('Response Error:', error);

        if (axios.isAxiosError(error) && error.config) {
            const originalRequest = error.config as ExtendedAxiosRequestConfig;

            // Handle both 401 (Unauthorized) and 403 (Forbidden) errors with token refresh
            if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Attempt to refresh the token
                    const refreshToken = await AsyncStorage.getItem('refreshToken');
                    
                    if (!refreshToken) {
                        console.error('No refresh token available');
                        // Force logout or navigate to login
                        throw new Error('Authentication required');
                    }

                    // Make the refresh token request
                    const response = await axios.post(`${BASE_URL}/token/refresh`, {
                        refreshToken,
                    });
                    // Verify we received a new token
                    if (!response.data.token) {
                        throw new Error('No token received from refresh endpoint');
                    }

                    const { token, refreshToken: rToken } = response.data;

                    // Save new token
                    await AsyncStorage.setItem('token', token);
                    await AsyncStorage.setItem('refreshToken', rToken);

                    // Update authorization header
                    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
                    
                    // Ensure headers object exists
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${token}`;

                    // Retry original request
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);

                    // Clear tokens on refresh failure
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('refreshToken');

                    // Create an authentication error
                    const authError: any = new Error('Authentication failed. Please log in again.');
                    authError.requiresLogin = true;
                    
                    // You could add navigation logic here if needed
                    // For example: navigate('/login');
                    
                    return Promise.reject(authError);
                }
            }

            // Handle other error responses with proper error enhancement
            if (error.response?.data) {
                // Create an enhanced error object
                const enhancedError: any = new Error(
                    error.response.data.message || error.message || 'API Error'
                );

                // Add useful properties to the error
                enhancedError.status = error.response.status;
                enhancedError.errorData = error.response.data;
                enhancedError.originalError = error;

                // Special handling for password reset required
                if (error.response.status === 400 &&
                    error.response.data.message === "Password reset required") {
                    enhancedError.requiresPasswordReset = true;
                }

                return Promise.reject(enhancedError);
            }
        } else if (error instanceof Error) {
            // Handle non-Axios errors (like network errors)
            console.error('Network or other error:', error.message);
            return Promise.reject(error);
        } else {
            // Handle unknown error types
            console.error('Unknown error type:', error);
            return Promise.reject(new Error('An unknown error occurred'));
        }

        // Fallback for unhandled cases
        return Promise.reject(error);
    }
);

export default apiClient;