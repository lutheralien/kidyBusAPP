
// src/api/api.service.ts
import { ApiErrorResponse, ApiSuccessResponse } from '../custom';
import { User } from '../types/user.types';
import Storage from '../utils/storage';
import apiClient from './api.client';
import axios from 'axios';

export const login = async (credentials: {
    phone: string;
    password: string;
    userType: "DRIVER" | "PARENT";
}): Promise<ApiSuccessResponse | ApiErrorResponse> => {
    try {
        const response = await apiClient.post('/common/auth/login', credentials);
        // Store token and refresh token
        if (response.data.token) {
            await Storage.setItem('token', response.data.token);
        }

        if (response.data.refreshToken) {
            await Storage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Store user role
        if (response.data.data.role) {
            await Storage.setItem('role', response.data.data.role);
        }

        if (response.data.data) {
            await Storage.setItem('user', response.data.data);
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
export const logout = async () => {
    // Get refresh token before removing it
    const refreshToken = await Storage.getItem('refreshToken');
    // Clear stored tokens
    await Storage.removeItem('token');
    await Storage.removeItem('refreshToken');
    await Storage.removeItem('role');

    // Optional: Call logout endpoint with refresh token in body
    try {
        await apiClient.post('/token/revoke', { refreshToken });
    } catch (error) {
        // Even if server-side logout fails, we still want to clear local storage
        console.error('Logout API call failed', error);
    }

    return { success: true };
};
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
export const fetchUserProfile = async (userId: string) => {
    return await apiClient.get(`/common/user/${userId}`);
};
export const updateUserProfile = async (userData: Partial<User>) => {
    // Extract the _id from userData
    const { _id, ...updateFields } = userData;
    
    // Call the new endpoint with the expected structure
    return await apiClient.put(`/common/update-user`, {
      id: _id,
      data: updateFields,
      userType: userData.role?.toUpperCase() === 'DRIVER' ? 'DRIVER' : 'PARENT'
    });
};
export const getStudentsAssignedToParent = async (userId: string) => {
    return await apiClient.get(`/student/by-parent/${userId}`);
};
export const getMapsApiKey = async () => {
    return await apiClient.get(`/common/map-key`);
};
export const getMapsRadius = async () => {
    return await apiClient.get(`/common/map-radius`);
};
export const getRoutes = async () => {
    return await apiClient.get(`/route`);
};
export const getTripsForParent = async (id: string) => {
    return await apiClient.get(`/trip/parent/${id}`);
};
export const getTripsForDriver = async (id: string) => {
    return await apiClient.get(`/trip/driver/${id}/today`);
};
export const getSpecificTrip = async (id: string) => {
    return await apiClient.get(`/trip/${id}`);
};
// Update trip status (in_progress, completed, cancelled)
export const updateTripStatus = async (tripId: string, status: 'in_progress' | 'completed' | 'cancelled') => {
    return await apiClient.put(`/trip/status/${tripId}`, { status });
};
export const updateStopStatus = async (
    tripId: string, 
    stopId: string, 
    status: 'completed' | 'missed' | 'cancelled',
    actualTime?: string,
    studentId?: string // New optional studentId parameter
) => {
    return await apiClient.put(`/trip/stop/${tripId}`, { 
        status,
        stopId,
        actualTime,
        ...(studentId ? { studentId } : {}) // Only include if provided
    });
};
export const getTripDetails = async (id: string) => {
    return await apiClient.get(`/trip/${id}`);
};
