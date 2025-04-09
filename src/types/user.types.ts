import { ILocation } from "../custom";

// src/types/user.types.ts
export type UserRole = 'DRIVER' | 'PARENT';

export interface User {
    _id: string;
    name: string;
    phone: string;
    address: string;
    role: UserRole;
    password: string;
    resetRequired: boolean;
    status: boolean;
    location: ILocation;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    rtoken: string | null;
    role: string | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    isAuthenticated: boolean;
}

export interface UserState {
    profile: User | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

