import { COLORS } from '@/src/constants/theme';
import moment from 'moment';


// Types
export interface IStudent {
  _id: string;
  name: string;
  class: string;
}

export interface IStop {
  stopId: string;
  sequence: number;
  plannedTime: string;
  actualTime?: string;
  status: string[] | string;
  type?: string;
  studentId?: IStudent;
  students?: IStudent[];
  _id: string;
  address?: string;
}

export interface IRouteInfo {
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

// Utility functions
export const formatTime = (time: string) => {
  if (!time) return '';
  return moment(time, 'HH:mm').format('h:mm A');
};

export const getStopStatusColor = (status: string | string[]) => {
  // If status is an array, use the first status
  const statusToCheck = Array.isArray(status) ? status[0] : status;
  
  switch(statusToCheck) {
    case 'completed': return COLORS.success;
    case 'missed': return COLORS.error;
    case 'cancelled': return COLORS.warning;
    case 'in_progress': return COLORS.info;
    default: return COLORS.gray; // pending
  }
};

export const getStudentStatusColor = (stop: IStop, studentIndex: number) => {
  if (!Array.isArray(stop.status)) return getStopStatusColor(stop.status);
  
  // Get the status for this specific student
  const studentStatus = stop.status[studentIndex] || 'pending';
  
  switch(studentStatus) {
    case 'completed': return COLORS.success;
    case 'missed': return COLORS.error;
    case 'cancelled': return COLORS.warning;
    case 'in_progress': return COLORS.info;
    default: return COLORS.gray; // pending
  }
};

export const getStatusIcon = (status: string) => {
  switch(status) {
    case 'scheduled': return 'clock';
    case 'in_progress': return 'navigation';
    case 'completed': return 'check-circle';
    case 'cancelled': return 'x-circle';
    case 'missed': return 'x';
    default: return 'help-circle';
  }
};

export const getReadableStatus = (status: string | string[]) => {
  // If status is an array, use the first status
  const statusToCheck = Array.isArray(status) ? status[0] : status;
  
  switch(statusToCheck) {
    case 'scheduled': return 'Scheduled';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'pending': return 'Pending';
    case 'missed': return 'Missed';
    default: return typeof statusToCheck === 'string' 
      ? statusToCheck.charAt(0).toUpperCase() + statusToCheck.slice(1) 
      : 'Unknown';
  }
};

export const getStudentReadableStatus = (stop: IStop, studentIndex: number) => {
  if (!Array.isArray(stop.status)) return getReadableStatus(stop.status);
  
  const studentStatus = stop.status[studentIndex] || 'pending';
  
  switch(studentStatus) {
    case 'scheduled': return 'Scheduled';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'pending': return 'Pending';
    case 'missed': return 'Missed';
    default: return studentStatus.charAt(0).toUpperCase() + studentStatus.slice(1);
  }
};

export const getEstimatedArrival = (plannedTime: string, tripStatus: string) => {
  if (tripStatus !== 'in_progress') return null;
  
  // For pending stops, calculate estimated time
  const now = moment();
  const planned = moment(plannedTime, 'HH:mm');
  
  // Ensure time is for today
  if (planned.isBefore(now) && planned.isBefore(now.clone().subtract(12, 'hours'))) {
    planned.add(1, 'day');
  }
  
  const diff = planned.diff(now, 'minutes');
  
  if (diff <= 0) {
    return 'due now';
  } else if (diff <= 60) {
    return `in ${diff} min`;
  } else {
    return `in ${Math.round(diff/60)} hr ${diff % 60} min`;
  }
};


  