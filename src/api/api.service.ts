
// src/api/authApi.ts
import { ApiErrorResponse, ApiSuccessResponse } from '../custom';
import { User } from '../types/user.types';
import apiClient from './api.client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


// User login

// User login with proper error typing
export const login = async (credentials: {
    phone: string;
    password: string;
    userType: "DRIVER" | "PARENT";
}): Promise<ApiSuccessResponse | ApiErrorResponse> => {
    try {
        console.log('Login Attempt:', credentials);

        const response = await apiClient.post('/common/auth/login', credentials);
        // Store token and refresh token
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
        }

        if (response.data.refreshToken) {
            await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }

        // Store user type
        if (response.data.userType) {
            await AsyncStorage.setItem('userType', response.data.userType);
        }

        return { success: true, data: response.data };
    } catch (error: unknown) {
        console.log('Login Error:', error);

        // Specific handling for password reset required
        if (axios.isAxiosError(error) && error.response?.data?.message === "Password reset required") {
            return {
                success: false,
                message: "Password reset required",
                code: "PASSWORD_RESET_REQUIRED"
            };
        }

        // Type guard for our enhanced error
        if (error instanceof Error) {
            const apiError = error as any; // Type assertion for our enhanced properties

            return {
                success: false,
                message: apiError.message || 'Login failed',
                code: apiError.status || 'UNKNOWN_ERROR'
            };
        }

        // Fallback for unexpected error types
        return {
            success: false,
            message: 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR'
        };
    }
};
// User signup
export const signup = async (userData: { email: string; password: string; name: string }) => {
    const response = await apiClient.post('/auth/register', userData);

    // Store token and refresh token
    if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
    }

    if (response.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return response;
};

// User logout
export const logout = async () => {
    // Get refresh token before removing it
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    // Clear stored tokens
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');

    // Optional: Call logout endpoint with refresh token in body
    try {
        await apiClient.post('/token/revoke', { refreshToken });
    } catch (error) {
        // Even if server-side logout fails, we still want to clear local storage
        console.error('Logout API call failed', error);
    }

    return { success: true };
};

// Forgot password
export const sendOTP = async (phone: string): Promise<ApiSuccessResponse | ApiErrorResponse> => {
    try {
        console.log('Send OTP Attempt:', { phone });

        const response = await apiClient.post('/common/otp-sms', { phone });

        console.log('Send OTP Success:', response.data);

        return { success: true, data: response.data };
    } catch (error: unknown) {
        console.log('Send OTP Error:', error);

        // Type guard for our enhanced error
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.message || 'Failed to send OTP';
            const errorCode = error.response?.data?.code || error.response?.status || 'UNKNOWN_ERROR';

            return {
                success: false,
                message: errorMessage,
                code: errorCode
            };
        }

        // Fallback for unexpected error types
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR'
        };
    }
};
export const verifyOTP = async (otp: string): Promise<ApiSuccessResponse | ApiErrorResponse> => {
    try {
        const response = await apiClient.post('/common/verify-otp', { otp });

        console.log('Verify OTP Success:', response.data);

        return { success: true, data: response.data };
    } catch (error: unknown) {
        console.log('Verify OTP Error:', error);

        // Type guard for Axios errors
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.message || 'Invalid verification code';
            const errorCode = error.response?.data?.code || error.response?.status || 'UNKNOWN_ERROR';

            return {
                success: false,
                message: errorMessage,
                code: errorCode
            };
        }

        // Fallback for unexpected error types
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR'
        };
    }
};
export const resetPassword = async (phone: string, newPassword: string, userType: 'DRIVER'|'PARENT'): Promise<ApiSuccessResponse | ApiErrorResponse> => {
    try {
        const response = await apiClient.post('/common/reset-password', {
            phone,
            password: newPassword,
            userType
        });

        console.log('Reset Password Success:', response.data);

        return { success: true, data: response.data };
    } catch (error: unknown) {
        console.log('Reset Password Error:', error);

        // Type guard for Axios errors
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.message || 'Failed to reset password';
            const errorCode = error.response?.data?.code || error.response?.status || 'UNKNOWN_ERROR';

            return {
                success: false,
                message: errorMessage,
                code: errorCode
            };
        }

        // Fallback for unexpected error types
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR'
        };
    }
};


// Fetch user profile
export const fetchUserProfile = async (userId: string) => {
    return await apiClient.get(`/common/user/${userId}`);
};

// Update user profile
export const updateUserProfile = async (userData: Partial<User>) => {
    return await apiClient.put(`/users/${userData.id}`, userData);
};

// Fetch all users (admin only)
export const fetchAllUsers = async (page = 1, limit = 10) => {
    return await apiClient.get('/users', {
        params: { page, limit },
    });
};

// Delete user (admin only)
export const deleteUser = async (userId: string) => {
    return await apiClient.delete(`/users/${userId}`);
};
// Change user role (admin only)
export const changeUserRole = async (userId: string, role: string) => {
    return await apiClient.patch(`/users/${userId}/role`, { role });
};