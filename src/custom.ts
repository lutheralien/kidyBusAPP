export interface ApiErrorResponse {
  success: false;
  message: string;
  data?: any;
  code?: number | string;
}

// Define a success response interface
export interface ApiSuccessResponse {
  success: true;
  data: any;
}

export interface ILocation {
  type: string;
  coordinates: number[];
  place: string;
}

// Updated Trip interface to match the actual API response
export interface IStudent {
  _id: string;
  name: string;
  class: string;
}

export interface StopStatus {
  _id: string;
  stopId: string;
  studentId?: string;
  plannedTime: string;
  actualTime?: string;
  status: "pending" | "completed" | "missed" | "cancelled";
  sequence: number;
}
export interface IStop {
  stopId: string;
  sequence: number;
  plannedTime: string;
  actualTime?: string;
  status: string[] | string; // Can be array or single string
  type?: string; // This property might not exist in some cases
  studentId?: IStudent; // Optional now
  students?: IStudent[]; // New field for multiple students at the same stop
  _id: string;
}

export interface IRouteInfo {
  _id: string;
  name: string;
  direction: "morning" | "afternoon";
}

export interface RouteInfo {
  _id: string;
  name: string;
  direction: "morning" | "afternoon";
}

export interface IDriverInfo {
  _id: string;
  name: string;
  phone: string;
  currentLocation: {
    type: string;
    coordinates: [number, number];
    place: string;
  };
}

export interface Trip {
  _id: string;
  routeId: IRouteInfo;
  driverId: IDriverInfo;
  date: string;
  direction: "morning" | "afternoon";
  status: string;
  stops: IStop[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export enum ERoles {
  "ADMIN" = "Admin",
  "PARENT" = "Parent",
  "DRIVER" = "Driver",
}
export enum ESocketEvents {
  // Connection events
  ADMIN_CONNECT = 'admin-connect',
  PARENT_CONNECT = 'parent-connect',
  DRIVER_CONNECT = 'driver-connect',
  ADMIN_CONNECTED = 'admin-connected',
  PARENT_CONNECTED = 'parent-connected',
  DRIVER_CONNECTED = 'driver-connected',
  TRIP_UPDATE = 'trip-update',
  STOP_UPDATE = 'stop-update',
  CONNECT = 'connect',
  CONNECT_ERROR = 'connect_error',

  // Location events
  LOCATION_UPDATE = 'location-update',
  ROUTE_UPDATE = 'route-update',

  // Status events
  ERROR = 'error',
  DISCONNECT = 'disconnect'
}

export const BASE_URL = 'http://192.168.1.49:3005/api/v1';

export const SOCKET_URL = BASE_URL.replace(/\/api\/v1$/, '');

