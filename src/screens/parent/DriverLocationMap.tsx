import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store/store';
import { COLORS, SIZES, FONTS } from '@/src/constants/theme';
import { Trip } from './tripUtils';

const { width, height } = Dimensions.get('window');

// Type definitions
interface DriverLocation {
  coordinates: [number, number]; // GeoJSON format: [longitude, latitude]
  place?: string;
  type: string;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RouteData {
  routeId: string;
  paths: {
    points: Coordinate[];
    distance: number;
    duration: number;
    summary: string;
  }[];
  totalDistance?: number;
  totalDuration?: number;
}

interface StopLocation {
  latitude: number;
  longitude: number;
  name?: string;
  description?: string;
}

interface DriverLocationMapProps {
  visible: boolean;
  onClose: () => void;
  driverLocation: DriverLocation | null;
  trip: Trip | null;
  routePath: Coordinate[];
  routeData?: RouteData | null;
  stopLocations?: StopLocation[];
}

const DriverLocationMap = ({ 
  visible, 
  onClose, 
  driverLocation, 
  trip, 
  routePath = [],
  routeData = null,
  stopLocations = []
}: DriverLocationMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const mapsKey = useSelector((state: RootState) => state.config.mapsKey);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  
  // This ref will help us track if we've already set the initial region
  const regionSetRef = useRef(false);

  // Get route coordinates based on available data
  const getRouteCoordinates = useCallback(() => {
    // If we have routeData with paths and points, use it
    if (routeData && 
        routeData.paths && 
        Array.isArray(routeData.paths) && 
        routeData.paths[0] && 
        routeData.paths[0].points && 
        Array.isArray(routeData.paths[0].points)) {
      
      console.log(`Using route data: ${routeData.paths[0].points.length} points`);
      return routeData.paths[0].points;
    }
    
    // Otherwise fall back to the simple routePath
    console.log(`Falling back to routePath: ${routePath.length} points`);
    return routePath;
  }, [routeData, routePath]);

  // Only set the initial region once when props change and we don't have a region yet
  useEffect(() => {
    // Skip if we already set a region or if the modal is not visible
    if (regionSetRef.current || !visible) return;

    let newRegion = null;

    // Try setting region in order of priority: 
    // 1. driver location, 2. route data, 3. route path, 4. school location
    if (driverLocation && driverLocation.coordinates) {
      // GeoJSON format uses [longitude, latitude]
      const [longitude, latitude] = driverLocation.coordinates;
      console.log('Setting region from driver location:', longitude, latitude);
      
      newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    } 
    else if (routeData && routeData.paths && routeData.paths[0]?.points?.length > 0) {
      const firstPoint = routeData.paths[0].points[0];
      console.log('Setting region from route data:', firstPoint);
      
      newRegion = {
        latitude: firstPoint.latitude,
        longitude: firstPoint.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    else if (routePath && routePath.length > 0) {
      console.log('Setting region from route path:', routePath[0]);
      newRegion = {
        latitude: routePath[0].latitude,
        longitude: routePath[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    else if (trip?.routeId?.schoolId?.location?.coordinates) {
      const [longitude, latitude] = trip.routeId.schoolId.location.coordinates;
      console.log('Setting region from school location:', longitude, latitude);
      newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Only update state if we have a valid region to set
    if (newRegion) {
      setInitialRegion(newRegion);
      regionSetRef.current = true;
    }
  }, [driverLocation, routePath, routeData, trip, visible]);

  // Reset the region tracking when modal closes
  useEffect(() => {
    if (!visible) {
      // Wait for close animation to complete
      setTimeout(() => {
        regionSetRef.current = false;
      }, 300);
    }
  }, [visible]);

  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    
    // Get the coordinates to fit
    const coordinates = getRouteCoordinates();
    
    // If we have route coordinates, fit the map to show all points
    if (coordinates && coordinates.length > 0 && mapRef.current) {
      console.log('Fitting map to coordinates, count:', coordinates.length);
      
      try {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true
        });
      } catch (error) {
        console.error('Error fitting map to coordinates:', error);
      }
    } else {
      console.log('No coordinates to fit map to');
    }
  }, [getRouteCoordinates]);

  if (!initialRegion) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalTitle}>Route Map</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.mapLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.mapLoadingText}>Loading route map...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Get the actual coordinates to render
  const routeCoordinates = getRouteCoordinates();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.mapModalContainer}>
        <View style={styles.mapModalContent}>
          <View style={styles.mapModalHeader}>
            <View>
              <Text style={styles.mapModalTitle}>
                {driverLocation && driverLocation.coordinates ? 'Driver Location' : 'Route Map'}
              </Text>
              <Text style={styles.mapModalSubtitle}>
                {trip?.routeId?.name || 'Route'} ({trip?.direction === 'afternoon' ? 'Afternoon' : 'Morning'})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            onMapReady={handleMapReady}
          >
            {/* Driver Marker */}
            {driverLocation && driverLocation.coordinates && (
              <Marker
                coordinate={{
                  latitude: driverLocation.coordinates[1],
                  longitude: driverLocation.coordinates[0]
                }}
                title="Driver Location"
                description={driverLocation.place || "Current Position"}
              >
                <View style={styles.driverMarker}>
                  <Ionicons name="bus" size={16} color={COLORS.white} />
                </View>
              </Marker>
            )}
            
            {/* Route Polyline - using the available route data */}
            {routeCoordinates && routeCoordinates.length > 0 && mapReady && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor={COLORS.primary}
                geodesic={true}
              />
            )}
            
            {/* School Marker */}
            {trip?.routeId?.schoolId?.location?.coordinates && (
              <Marker
                coordinate={{
                  latitude: trip.routeId.schoolId.location.coordinates[1],
                  longitude: trip.routeId.schoolId.location.coordinates[0]
                }}
                title="School"
                description={trip.routeId.schoolId.name || "School"}
              >
                <View style={styles.schoolMarker}>
                  <MaterialIcons name="school" size={16} color={COLORS.white} />
                </View>
              </Marker>
            )}
            
            {/* Stop Locations from real-time data */}
            {stopLocations && stopLocations.length > 0 && stopLocations.map((stop, index) => (
              <Marker
                key={`stop-${index}`}
                coordinate={{
                  latitude: stop.latitude,
                  longitude: stop.longitude
                }}
                title={stop.name || `Stop ${index + 1}`}
                description={stop.description || "Bus Stop"}
              >
                <View style={styles.stopMarker}>
                  <Feather name="map-pin" size={14} color={COLORS.white} />
                </View>
              </Marker>
            ))}
            
            {/* Student Stop Markers - fallback if no real-time stop data */}
            {(!stopLocations || stopLocations.length === 0) && trip?.stops?.map((stop, index) => {
              if (stop.studentId?.parent?.location?.coordinates) {
                return (
                  <Marker
                    key={`trip-stop-${index}`}
                    coordinate={{
                      latitude: stop.studentId.parent.location.coordinates[1],
                      longitude: stop.studentId.parent.location.coordinates[0]
                    }}
                    title={stop.studentId.name}
                    description={`Planned: ${stop.plannedTime}`}
                  >
                    <View style={styles.stopMarker}>
                      <Feather name="map-pin" size={14} color={COLORS.white} />
                    </View>
                  </Marker>
                );
              }
              return null;
            })}
          </MapView>
          
          {/* Show route distance if available */}
          {routeData && routeData.totalDistance && (
            <View style={styles.routeInfoContainer}>
              <Text style={styles.routeInfoText}>
                Distance: {routeData.totalDistance.toFixed(2)} km
              </Text>
              {routeData.totalDuration && (
                <Text style={styles.routeInfoText}>
                  Est. Time: {Math.round(routeData.totalDuration)} min
                </Text>
              )}
            </View>
          )}
          
          {/* Live indicator - only show when driver location is available */}
          {driverLocation && driverLocation.coordinates ? (
            <View style={styles.mapLiveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.mapLiveText}>LIVE TRACKING</Text>
            </View>
          ) : (
            <View style={styles.noDriverContainer}>
              <Feather name="info" size={16} color={COLORS.white} />
              <Text style={styles.noDriverText}>Showing planned route. Driver location not available yet.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  mapModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  mapModalContent: {
    height: height * 0.8,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.m,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.gray}20`,
  },
  mapModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h3,
    color: COLORS.text,
  },
  mapModalSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.m,
  },
  mapLiveIndicator: {
    position: 'absolute',
    top: 70,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SIZES.s,
    paddingVertical: SIZES.xs,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SIZES.xs,
  },
  mapLiveText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.caption,
    color: COLORS.white,
    marginLeft: SIZES.xs,
  },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  schoolMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  stopMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  noDriverContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SIZES.s,
    paddingVertical: SIZES.s,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDriverText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body3,
    color: COLORS.white,
    marginLeft: SIZES.xs,
    textAlign: 'center',
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: SIZES.s,
    borderRadius: SIZES.s,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  routeInfoText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
  },
});

export default DriverLocationMap;