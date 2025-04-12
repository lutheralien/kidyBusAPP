// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { login, logout } from '../../api/api.service';
import { User, AuthState } from '../../types/user.types';

// Define the initial state
const initialState: AuthState = {
  user: null,
  token: '',
  refreshToken: '',
  role: '',
  status: 'idle',
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: { phone: string; password: string, userType: "DRIVER" | "PARENT" }, { rejectWithValue }) => {
      try {
        const response = await login(credentials);
        // The API might be returning {success: false, message: ...} which isn't an error
        // but rather a failed login that needs to be handled
        if (!response.success) {
          return rejectWithValue(response);
        }
        
        return response.data;
      } catch (error: any) {
        // Handle the case where the API returns an actual error
        if (error.errorData) {
          return rejectWithValue(error.errorData);
        }
        
        return rejectWithValue({
          message: error.message || 'Login failed',
          success: false,
          code: error.status || 'UNKNOWN_ERROR'
        });
      }
    }
  );

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; role: string; refreshToken: string; }>
    ) => {
      const { user, token, role, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.role = role;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.data;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.role = action.payload.data.role;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.status = 'idle';
      });
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export default authSlice.reducer;

