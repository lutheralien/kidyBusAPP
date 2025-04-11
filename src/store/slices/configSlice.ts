// src/store/slices/configSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getMapsApiKey, getMapsRadius } from '../../api/api.service';
import { ILocation } from '@/src/custom';

// Define the configuration state type
export interface ConfigState {
  mapsKey: string;
  mapRadius: number;
  userLocation: ILocation;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Define the initial state
const initialState: ConfigState = {
    mapsKey: '',
    mapRadius: 0,
    userLocation: {
      type: 'Point', // Add the missing required property
      coordinates: [0, 0],
      place: ''
    },
    status: 'idle',
    error: null,
  };

// Async thunks
export const fetchMapsKey = createAsyncThunk(
    'config/fetchMapsKey',
    async (_, { rejectWithValue }) => {
      try {
        const response = await getMapsApiKey();
        
        // Correctly extract data from the Axios response
        // Assuming your API returns { data: { success: boolean, data: any, message?: string } }
        if (!response.data.success) {
          return rejectWithValue(response.data.message || 'Failed to fetch maps API key');
        }
        
        return response.data.data; // Extract the actual data
      } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch maps API key');
      }
    }
  );

export const fetchMapRadius = createAsyncThunk(
  'config/fetchMapRadius',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMapsRadius();
      
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch map radius');
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch map radius');
    }
  }
);

// Create slice
const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setUserLocation: (state, action: PayloadAction<ILocation>) => {
      state.userLocation = action.payload;
    },
    resetConfigState: (state) => {
      state.mapsKey = '';
      state.mapRadius = 0;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Maps Key fetch cases
      .addCase(fetchMapsKey.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMapsKey.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.mapsKey = action.payload;
      })
      .addCase(fetchMapsKey.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Map Radius fetch cases
      .addCase(fetchMapRadius.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMapRadius.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.mapRadius = action.payload;
      })
      .addCase(fetchMapRadius.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { setUserLocation, resetConfigState } = configSlice.actions;

export default configSlice.reducer;