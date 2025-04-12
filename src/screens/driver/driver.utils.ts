import { RouteAlternative } from "./driver.types";
import { Coordinates, RoutePath } from "./driver.types";

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Distance in meters
};

// Helper function to decode Google's polyline format
export const decodePolyline = (encoded: string): Coordinates[] => {
  const points: Coordinates[] = [];
  let index = 0, lat = 0, lng = 0;
  
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }
  
  return points;
};

// Function to fetch directions between waypoints using Google Directions API
export const fetchDirections = async (
  origin: Coordinates, 
  destination: Coordinates, 
  mapsKey: string, 
  waypoints: Coordinates[] = []
): Promise<RoutePath | null> => {
  if (!mapsKey) {
    console.log("Maps API key not available");
    return null;
  }
  
  try {
    // Format origin and destination
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    // Format waypoints if any
    let waypointsStr = "";
    if (waypoints.length > 0) {
      waypointsStr = `&waypoints=optimize:true|${waypoints
        .map(wp => `${wp.latitude},${wp.longitude}`)
        .join("|")}`;
    }
    
    // Build the URL
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}${waypointsStr}&key=${mapsKey}`;
    
    // Make the request
    const response = await fetch(url);
    const json = await response.json();
    
    if (json.status !== "OK") {
      console.error("Directions API error:", json.status);
      return null;
    }
    
    // Parse the route
    const route = json.routes[0];
    if (!route) {
      console.log("No route found");
      return null;
    }
    
    // Extract route polyline points
    const points: Coordinates[] = decodePolyline(route.overview_polyline.points);
    
    // Get route details
    const distance = route.legs.reduce((acc: number, leg: any) => acc + leg.distance.value, 0) / 1000; // in km
    const duration = route.legs.reduce((acc: number, leg: any) => acc + leg.duration.value, 0) / 60; // in minutes
    const summary = route.summary || "Route";
    
    return {
      points,
      distance,
      duration,
      summary
    };
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
};

// Fetch directions with alternative routes
export const fetchDirectionsWithAlternatives = async (
  origin: Coordinates,
  destination: Coordinates,
  mapsKey: string,
  waypoints: Coordinates[] = []
): Promise<RoutePath[] | null> => {
  if (!mapsKey) {
    console.log("Maps API key not available");
    return null;
  }
  
  try {
    // Format origin and destination
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    // Format waypoints if any
    let waypointsStr = "";
    if (waypoints.length > 0) {
      waypointsStr = `&waypoints=optimize:true|${waypoints
        .map(wp => `${wp.latitude},${wp.longitude}`)
        .join("|")}`;
    }
    
    // Request alternative routes if no waypoints (API limitation)
    const alternativesParam = waypoints.length > 0 ? "" : "&alternatives=true";
    
    // Build the URL
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}${waypointsStr}${alternativesParam}&key=${mapsKey}`;
    
    // Make the request
    const response = await fetch(url);
    const json = await response.json();
    
    if (json.status !== "OK") {
      console.error("Directions API error:", json.status);
      return null;
    }
    
    // Parse all routes (primary + alternatives)
    if (!json.routes || json.routes.length === 0) {
      console.log("No routes found");
      return null;
    }
    
    const routes: RoutePath[] = json.routes.map((route: any) => {
      // Extract route polyline points
      const points: Coordinates[] = decodePolyline(route.overview_polyline.points);
      
      // Get route details
      const distance = route.legs.reduce((acc: number, leg: any) => acc + leg.distance.value, 0) / 1000; // in km
      const duration = route.legs.reduce((acc: number, leg: any) => acc + leg.duration.value, 0) / 60; // in minutes
      const summary = route.summary || "Route";
      
      return {
        points,
        distance,
        duration,
        summary
      };
    });
    
    return routes;
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
};
export const fetchAlternativeRoutes = async (
    waypoints: Coordinates[],
    apiKey: string
  ): Promise<RouteAlternative[]> => {
    if (!apiKey || waypoints.length < 2) {
      console.log("Invalid API key or insufficient waypoints");
      return [];
    }
    
    try {
      const alternatives: RouteAlternative[] = [];
      
      // Try to fetch routes with different waypoint orders to get alternatives
      // First attempt: Use standard order (first to last)
      const standardRoute = await fetchRouteWithWaypoints(
        waypoints[0],
        waypoints[waypoints.length - 1],
        waypoints.slice(1, -1),
        apiKey
      );
      
      if (standardRoute) {
        alternatives.push({
          id: "route-1",
          paths: [standardRoute],
          isSelected: true,
          summary: `Route 1: ${standardRoute.summary}`,
          totalDistance: standardRoute.distance,
          totalDuration: standardRoute.duration
        });
      }
      
      // Second attempt: Try a different route configuration (reverse waypoint order)
      // This can simulate an alternate route
      const reverseWaypoints = [...waypoints.slice(1, -1)].reverse();
      const alternateRoute = await fetchRouteWithWaypoints(
        waypoints[0],
        waypoints[waypoints.length - 1],
        reverseWaypoints,
        apiKey
      );
      
      if (alternateRoute && 
          (!standardRoute || 
           Math.abs(alternateRoute.distance - standardRoute.distance) > 0.5)) {
        alternatives.push({
          id: "route-2",
          paths: [alternateRoute],
          isSelected: alternatives.length === 0,
          summary: `Route 2: ${alternateRoute.summary}`,
          totalDistance: alternateRoute.distance,
          totalDuration: alternateRoute.duration
        });
      }
      
      // If no alternatives yet, try one more approach with optimization
      if (alternatives.length < 2) {
        const optimizedRoute = await fetchRouteWithWaypoints(
          waypoints[0],
          waypoints[waypoints.length - 1],
          waypoints.slice(1, -1),
          apiKey,
          true // Optimize waypoints
        );
        
        if (optimizedRoute && 
            (!standardRoute || 
             Math.abs(optimizedRoute.distance - standardRoute.distance) > 0.3)) {
          alternatives.push({
            id: "route-optimized",
            paths: [optimizedRoute],
            isSelected: alternatives.length === 0,
            summary: `All Stops: ${optimizedRoute.summary}`,
            totalDistance: optimizedRoute.distance,
            totalDuration: optimizedRoute.duration
          });
        }
      }
      
      return alternatives;
    } catch (error) {
      console.error("Error fetching alternative routes:", error);
      return [];
    }
  };

  // Helper function to fetch a route with waypoints
  export const fetchRouteWithWaypoints = async (
    origin: Coordinates,
    destination: Coordinates,
    waypoints: Coordinates[],
    apiKey: string,
    routeName: string = '',
    optimize: boolean = false
  ): Promise<RoutePath | null> => {
    try {
      // Format origin and destination
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      
      // Format waypoints
      let waypointsStr = "";
      if (waypoints.length > 0) {
        waypointsStr = `&waypoints=${optimize ? 'optimize:true|' : ''}${waypoints
          .map(wp => `${wp.latitude},${wp.longitude}`)
          .join("|")}`;
      }
      
      // Build the URL
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}${waypointsStr}&key=${apiKey}`;
      
      // Make the request
      const response = await fetch(url);
      console.log('response',response);
      
      const json = await response.json();
      
      if (json.status !== "OK") {
        console.error(`Directions API error for "${routeName}":`, json.status);
        return null;
      }
      
      // Parse the route
      const route = json.routes[0];
      if (!route) {
        console.log(`No route found for "${routeName}"`);
        return null;
      }
      
      // Extract route polyline points
      const points: Coordinates[] = decodePolyline(route.overview_polyline.points);
      
      // Get route details
      const distance = route.legs.reduce((acc: number, leg: any) => acc + leg.distance.value, 0) / 1000; // in km
      const duration = route.legs.reduce((acc: number, leg: any) => acc + leg.duration.value, 0) / 60; // in minutes
      
      return {
        points,
        distance,
        duration,
        summary: routeName
      };
    } catch (error) {
      console.log(`Error fetching route "${routeName}":`, error);
      return null;
    }
  };
