import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Extend the AxiosRequestConfig interface
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

const BASE_URL = 'http://172.20.10.2:3005/api/v1';
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
        console.error('Response Error:', error);

        if (axios.isAxiosError(error) && error.config) {
            const originalRequest = error.config as ExtendedAxiosRequestConfig;

            // Log detailed error information
            if (error.response) {
                console.error('Response Error Details:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
            }

            // Handle 401 (Unauthorized) errors with token refresh
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Attempt to refresh the token
                    const refreshToken = await AsyncStorage.getItem('refreshToken');

                    if (refreshToken) {
                        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
                            refreshToken,
                        });

                        const { token } = response.data;

                        // Save new token
                        await AsyncStorage.setItem('token', token);

                        // Update authorization header
                        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers.Authorization = `Bearer ${token}`;

                        // Retry original request
                        return apiClient(originalRequest);
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);

                    // Clear tokens on refresh failure
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('refreshToken');

                    // You could add navigation logic here if needed
                }
            }

            // Handle 400 errors with proper error enhancement
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
        } else {
            // Handle unknown error types
            console.error('Unknown error type:', error);
        }

        // Fallback for unhandled cases
        return Promise.reject(error);
    }
);

export default apiClient;