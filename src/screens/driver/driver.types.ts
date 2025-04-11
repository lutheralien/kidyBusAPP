import { ILocation } from "@/src/custom";

interface School {
    _id: string;
    name: string;
    address: string;
    location: {
        type: string;
        coordinates: number[];
    };
}
interface Parent {
    _id: string;
    name: string;
    phone: string;
    location: ILocation;
}
interface Student {
    _id: string;
    name: string;
    class: string;
    parent: Parent;
}
interface Stop {
    stopId: string;
    studentId?: Student;
    plannedTime: string;
    status: string;
    sequence: number;
    _id: string;
}
interface Route {
    _id: string;
    name: string;
    direction: string;
    schoolId: School;
    stops: {
        stopId: string;
        type: "pickup" | "dropoff" | "school";
        _id: string;
    }[];
}
interface Trip {
    _id: string;
    routeId: Route;
    driverId: string;
    date: string;
    direction: string;
    status: string;
    stops: Stop[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}
export interface TripResponse {
    success: boolean;
    message: string;
    data: Trip[];
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
interface RoutePath {
    points: Coordinates[];
    distance: number;
    duration: number;
    summary: string;
}
export interface RouteAlternative {
    id: string;
    paths: RoutePath[];
    isSelected: boolean;
    summary: string;
    totalDistance: number;
    totalDuration: number;
}