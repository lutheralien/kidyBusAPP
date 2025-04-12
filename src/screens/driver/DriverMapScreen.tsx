import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  Platform,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import { useRoute, RouteProp } from "@react-navigation/native";
import { DriverStackParamList } from "../../types/navigation.types";
import { Feather, Ionicons } from "@expo/vector-icons";
import MapView, {
  Polyline,
  PROVIDER_GOOGLE,
  Marker,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { getTripsForDriver, updateStopStatus, getSpecificTrip } from "@/src/api/api.service";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store/store";
import * as Location from "expo-location";
import Geocoder from "react-native-geocoding";
import { setUserLocation } from "@/src/store/slices/configSlice";
import { calculateDistance, fetchAlternativeRoutes, fetchRouteWithWaypoints } from "./driver.utils";
import useAuth from "@/src/hooks/useAuth";
import { ERoles, ESocketEvents, ILocation, SOCKET_URL, Trip } from "@/src/custom";
import { Coordinates, RouteAlternative, TripResponse } from "./driver.types";
import { io, Socket } from "socket.io-client";
import Toast from "react-native-toast-message";
import moment from "moment";

// Types
type DriverMapScreenRouteProp = RouteProp<DriverStackParamList, "DRIVER_MAP">;

// StudentSelectionModal component
const StudentSelectionModal = ({
  visible,
  onClose,
  students,
  onSelectStudent,
  stop,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Student</Text>
            <Text style={styles.modalSubtitle}>
              Stop: {stop?.address || "Location"} | Time: {stop?.plannedTime}
            </Text>
          </View>
          
          <FlatList
            data={students}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.studentItem}
                onPress={() => {
                  onSelectStudent(stop, item);
                  onClose();
                }}
              >
                <View style={styles.studentAvatar}>
                  <Feather name="user" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.studentItemDetails}>
                  <Text style={styles.studentItemName}>{item.name}</Text>
                  <Text style={styles.studentItemClass}>{item.class}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          />
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// StopActionModal component
const StopActionModal = ({
  visible,
  onClose,
  stop,
  student,
  tripId,
  onUpdateSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  // Get current time in HH:mm format
  const getCurrentTime = () => {
    return moment().format("HH:mm");
  };

  // Handle marking stop as complete
  const handleComplete = async () => {
    if (!stop) return;
    setLoading(true);
    try {
      await updateStopStatus(
        tripId,
        stop.stopId,
        "completed",
        getCurrentTime(),
        student?._id
      );
      onUpdateSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating stop status:", error);
      Alert.alert("Error", "Failed to update stop status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle marking stop as missed
  const handleMissed = async () => {
    if (!stop) return;
    setLoading(true);
    try {
      await updateStopStatus(
        tripId,
        stop.stopId,
        "missed",
        getCurrentTime(),
        student?._id
      );
      onUpdateSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Handle marking stop as cancelled
  const handleCancelled = async () => {
    if (!stop) return;
    setLoading(true);
    try {
      await updateStopStatus(
        tripId,
        stop.stopId,
        "cancelled",
        getCurrentTime(),
        student?._id
      );
      onUpdateSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!stop) return null;

  // Get modal title based on whether we're updating a specific student or a school stop
  const getModalTitle = () => {
    if (stop.type === "school") return "Update School Stop";
    return student ? `Update Student Status` : "Update Stop Status";
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>
            {student && (
              <Text style={styles.modalSubtitle}>
                {student.name} - {stop.plannedTime}
              </Text>
            )}
            {!student && stop.type !== "school" && (
              <Text style={styles.modalSubtitle}>
                All students at this stop - {stop.plannedTime}
              </Text>
            )}
            {stop.type === "school" && (
              <Text style={styles.modalSubtitle}>
                School Stop - {stop.plannedTime}
              </Text>
            )}
            <Text style={styles.modalSubtitle}>
              Stop ID: {stop.stopId} | Sequence: {stop.sequence}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.modalLoading} />
          ) : (
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.completeButton]}
                onPress={handleComplete}
              >
                <Feather name="check-circle" size={18} color={COLORS.white} style={styles.modalButtonIcon} />
                <Text style={styles.modalButtonText}>Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.missedButton]}
                onPress={handleMissed}
              >
                <Feather name="x-circle" size={18} color={COLORS.white} style={styles.modalButtonIcon} />
                <Text style={styles.modalButtonText}>Missed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelledButton]}
                onPress={handleCancelled}
              >
                <Feather name="slash" size={18} color={COLORS.white} style={styles.modalButtonIcon} />
                <Text style={styles.modalButtonText}>Cancelled</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// RouteSelector component
const RouteSelector = ({ 
  routes, 
  onSelect, 
  onClose, 
  isVisible, 
  routeColors 
}) => {
  if (!isVisible) return null;
  
  return (
    <View style={styles.routeSelectorContainer}>
      <View style={styles.routeSelectorHeader}>
        <Text style={styles.routeSelectorTitle}>Route Options</Text>
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={routes}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.routeOption,
              item.isSelected && styles.routeOptionSelected,
              {
                borderLeftColor: routeColors[index % routeColors.length],
              },
            ]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={styles.routeOptionTitle}>{`Route ${index + 1}`}</Text>
            <Text style={styles.routeOptionDetail}>{item.summary}</Text>
            <Text style={styles.routeOptionDetail}>
              {`${item.totalDistance.toFixed(1)} km • ${Math.round(
                item.totalDuration
              )} min`}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Trip Status Buttons Component
const TripStatusControls = ({ tripStatus, onStatusChange }) => {
  return (
    <View style={styles.tripStatusContainer}>
      <Text style={styles.statusHeading}>
        Status: <Text style={styles.currentStatus}>{tripStatus?.replace('_', ' ')}</Text>
      </Text>
      
      <View style={styles.statusButtonsRow}>
        {/* Show Start button only for scheduled trips */}
        {tripStatus === 'scheduled' && (
          <TouchableOpacity
            style={[styles.statusButton, styles.startButton]}
            onPress={() => onStatusChange('in_progress')}
          >
            <Feather name="play" size={16} color={COLORS.white} />
            <Text style={styles.statusButtonText}>Start Trip</Text>
          </TouchableOpacity>
        )}
        
        {/* Show Complete button only for in-progress trips */}
        {tripStatus === 'in_progress' && (
          <TouchableOpacity
            style={[styles.statusButton, styles.completeButton]}
            onPress={() => onStatusChange('completed')}
          >
            <Feather name="check-circle" size={16} color={COLORS.white} />
            <Text style={styles.statusButtonText}>Complete Trip</Text>
          </TouchableOpacity>
        )}
        
        {/* Show Cancel button for scheduled or in-progress trips */}
        {(tripStatus === 'scheduled' || tripStatus === 'in_progress') && (
          <TouchableOpacity
            style={[styles.statusButton, styles.cancelButton]}
            onPress={() => onStatusChange('cancelled')}
          >
            <Feather name="x-circle" size={16} color={COLORS.white} />
            <Text style={styles.statusButtonText}>Cancel Trip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const DriverMapScreen = () => {
  const route = useRoute<DriverMapScreenRouteProp>();
  const { tripId } = route.params;
  const dispatch = useDispatch();
  const userLocation = useSelector(
    (state: RootState) => state.config.userLocation
  );
  const mapsKey = useSelector((state: RootState) => state.config.mapsKey);
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const locationUpdateRef = useRef<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [stopCoordinates, setStopCoordinates] = useState<Coordinates[]>([]);
  const [stopDataMap, setStopDataMap] = useState<Map<string, any>>(new Map());
  const [routeAlternatives, setRouteAlternatives] = useState<RouteAlternative[]>([]);
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [previousLocation, setPreviousLocation] = useState<Coordinates | null>(null);
  const [markersReady, setMarkersReady] = useState<boolean>(false);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);
  const [showRouteSelector, setShowRouteSelector] = useState<boolean>(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  // Add state for stop update modal
  const [selectedStop, setSelectedStop] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSelectionVisible, setStudentSelectionVisible] = useState(false);
  const [studentsToSelect, setStudentsToSelect] = useState([]);

  // Constants
  const LOCATION_UPDATE_THRESHOLD = 1.5; // 1.5 meters radius
  const MARKER_DELAY = 200; // Delay in ms before showing markers
  const ROUTE_COLORS = [COLORS.primary, "#FF9500", "#4CD964"]; // Colors for different routes

  // Function to emit location updates with optional status
  const emitLocationUpdate = useCallback(
    (currentLocation: { longitude: any; latitude: any; }, tripStatus?: string) => {
      if (!socketRef.current || !socketConnected || !tripId) {
        return;
      }
    
      socketRef.current.emit(ESocketEvents.LOCATION_UPDATE, {
        tripId: tripId,
        userId: user?._id,
        userType: ERoles.DRIVER,
        status: tripStatus, // Pass the optional status parameter
        location: {
          type: "Point",
          coordinates: [
            currentLocation.longitude,
            currentLocation.latitude,
          ],
          place: userLocation?.place || "",
        }
      });
    },
    [socketRef, socketConnected, tripId, user, userLocation]
  );

  // Trip status change handler
  const handleTripStatusChange = useCallback((newStatus) => {
    if (!tripData || newStatus === tripData.status) return;
    
    Alert.alert(
      "Update Trip Status",
      `Are you sure you want to change trip status to ${newStatus.replace('_', ' ')}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes", 
          onPress: () => {
            // Get current location
            if (userLocation && userLocation.coordinates) {
              const currentLocation = {
                longitude: userLocation.coordinates[0],
                latitude: userLocation.coordinates[1]
              };
              
              // Update local trip data state
              setTripData(prev => prev ? { ...prev, status: newStatus } : null);
              
              // Emit location update with status change
              emitLocationUpdate(currentLocation, newStatus);
              
              // Show toast confirmation
              Toast.show({
                type: "success",
                text1: "Trip Status Updated",
                text2: `Trip is now ${newStatus.replace('_', ' ')}`,
                position: "bottom",
                visibilityTime: 3000,
              });
              
              // Vibrate device for feedback
              if (Platform.OS === "android" || Platform.OS === "ios") {
                Vibration.vibrate(200);
              }
            } else {
              Toast.show({
                type: "error",
                text1: "Update Failed",
                text2: "Could not get your current location",
                position: "bottom",
              });
            }
          } 
        }
      ]
    );
  }, [tripData, userLocation, emitLocationUpdate]);

  // Function to set up socket connection
  const setupSocket = useCallback(() => {
    if (!user?._id) return;

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection
    socketRef.current = io(SOCKET_URL);

    // Socket connection handlers
    socketRef.current.on(ESocketEvents.CONNECT, () => {
      console.log("Socket connected");
      setSocketConnected(true);

      // Emit parent connection event
      socketRef.current?.emit(ESocketEvents.DRIVER_CONNECT, { id: user._id });

      Toast.show({
        type: "success",
        text1: "Connected",
        text2: "Real-time updates are now enabled",
        position: "bottom",
        visibilityTime: 5000,
      });
    });

    // Handle socket connection error
    socketRef.current.on(ESocketEvents.CONNECT_ERROR, (error) => {
      console.log("Socket connection error:", error);
      setSocketConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [user?._id]);

  useEffect(() => {
    fetchTripData();
    const cleanup = setupSocket();

    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [tripId, setupSocket, user]);

  // Add delay before rendering markers to ensure map is fully loaded
  useEffect(() => {
    if (stopCoordinates.length > 0) {
      const timer = setTimeout(() => {
        setMarkersReady(true);
      }, MARKER_DELAY);

      return () => clearTimeout(timer);
    }
  }, [stopCoordinates]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission to access location was denied");
          return;
        }

        const longitude = userLocation.coordinates[0];
        const latitude = userLocation.coordinates[1];

        setPreviousLocation({
          latitude,
          longitude,
        });
      } catch (error) {
        console.error("Error getting initial location:", error);
      }
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (mapsKey) {
      try {
        Geocoder.init(mapsKey);
      } catch (error) {
        console.error("Failed to initialize Geocoder:", error);
      }
    }
  }, [mapsKey]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    // Use the ref defined at component level
    const MIN_UPDATE_INTERVAL = 1000; // 1 seconds between updates to state
    console.log('MIN_UPDATE_INTERVAL',MIN_UPDATE_INTERVAL);
    

    const setupLocationTracking = async () => {
      try {
        console.log('sett up lc');
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest, // Lower accuracy to reduce updates
            distanceInterval: 1.5, // Only update when moved 5 meters
            timeInterval: MIN_UPDATE_INTERVAL, // Update every 3 seconds maximum
          },
          (location) => {
            const currentLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            const now = Date.now();
            // Skip updates that come too quickly to prevent re-renders
            if (now - locationUpdateRef.current < MIN_UPDATE_INTERVAL) {
                console.log('here');
                
              return;
            }

            locationUpdateRef.current = now;
            
            // Only calculate distance & update location if we have a previous location
            console.log('previousLocation',previousLocation);
            
            if (previousLocation) {
                const distance = calculateDistance(
                    previousLocation.latitude,
                    previousLocation.longitude,
                    currentLocation.latitude,
                    currentLocation.longitude
                );
                console.log('distance',distance);

              // Only trigger updates if we've moved a significant distance
              if (distance > LOCATION_UPDATE_THRESHOLD) {
                emitLocationUpdate(currentLocation);
                // Geocode less frequently
                if (mapsKey && distance > 50) {
                  // Only geocode after moving 50 meters
                  // Use a non-async approach for geocoding
                  Geocoder.from(
                    currentLocation.latitude,
                    currentLocation.longitude
                  )
                    .then((response) => {
                      const place =
                        response.results[0]?.formatted_address || "";
                      dispatch(
                        setUserLocation({
                          type: "Point",
                          coordinates: [
                            location.coords.longitude,
                            location.coords.latitude,
                          ],
                          place: place,
                        })
                      );

                      if (Platform.OS === "android" || Platform.OS === "ios") {
                        Vibration.vibrate(500);
                      }
                    })
                    .catch((geocodeError) => {
                      console.error("Geocoding error:", geocodeError);
                      dispatch(
                        setUserLocation({
                          type: "Point",
                          coordinates: [
                            location.coords.longitude,
                            location.coords.latitude,
                          ],
                          place: "",
                        })
                      );
                    });
                } else {
                  // Just update coordinates without geocoding
                  dispatch(
                    setUserLocation({
                      type: "Point",
                      coordinates: [
                        location.coords.longitude,
                        location.coords.latitude,
                      ],
                      place: previousLocation ? userLocation?.place || "" : "",
                    })
                  );

                  if (
                    distance > LOCATION_UPDATE_THRESHOLD &&
                    (Platform.OS === "android" || Platform.OS === "ios")
                  ) {
                    Vibration.vibrate(500);
                  }
                }

                setPreviousLocation(currentLocation);
              }
            } else {
              // First location update
              dispatch(
                setUserLocation({
                  type: "Point",
                  coordinates: [
                    location.coords.longitude,
                    location.coords.latitude,
                  ],
                  place: "",
                })
              );
              setPreviousLocation(currentLocation);
            }
          }
        );
      } catch (error) {
        console.error("Error setting up location tracking:", error);
      }
    };

    setupLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [dispatch, mapsKey]);

  const fetchTripData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Use getSpecificTrip instead of getTripsForDriver
      const response = await getSpecificTrip(tripId);
      
      if (response.data.success) {
        const trip = response.data.data;
        setTripData(trip);
        processRouteData(trip);
      } else {
        console.log("Failed to get trip data:", response.data.message);
        setError("Failed to load trip data");
      }
    } catch (err) {
      console.error("Error fetching trip data:", err);
      setError("Error loading trip map data");
    } finally {
      setLoading(false);
    }
  };

  const processRouteData = async (trip: Trip): Promise<void> => {
    if (!trip || !trip.stops || trip.stops.length === 0) {
      setError("No route data available");
      return;
    }

    try {
      // Reset markers ready state when processing new data
      setMarkersReady(false);
      setRouteLoading(true);

      // Sort stops by sequence
      const sortedStops = [...trip.stops].sort(
        (a, b) => a.sequence - b.sequence
      );

      // Create a map to store stop data by coordinates
      const newStopDataMap = new Map();

      // Extract coordinates for stops
      const coordinates: Coordinates[] = [];
      const invalidCoordinates: any[] = [];

      // Check if we have a school location and add it first
      let schoolCoordinates: Coordinates | null = null;
      if (trip.routeId?.schoolId?.location?.coordinates) {
        try {
          const schoolCoords = trip.routeId.schoolId.location.coordinates;
          if (Array.isArray(schoolCoords) && schoolCoords.length === 2) {
            const [longitude, latitude] = schoolCoords;

            if (
              typeof latitude === "number" &&
              typeof longitude === "number" &&
              latitude >= -90 &&
              latitude <= 90 &&
              longitude >= -180 &&
              longitude <= 180
            ) {
              schoolCoordinates = {
                latitude,
                longitude,
              };
              coordinates.push(schoolCoordinates);
              
              // Add school to stopDataMap
              const coordKey = `${latitude},${longitude}`;
              newStopDataMap.set(coordKey, {
                type: "school",
                students: [],
                stopData: sortedStops.find(s => s.sequence === 0) || null
              });
              
            } else {
              console.log("School coordinates invalid:", schoolCoords);
            }
          }
        } catch (schoolError) {
          console.error("Error processing school location:", schoolError);
        }
      } else {
        console.log("No school location data available");
      }

      // Process parent locations from stops
      const parentLocationsMap = new Map<string, any>();

      // Collect parent locations and associated students/stops
      sortedStops.forEach((stop, index) => {
        try {
          if (stop.studentId?.parent?.location) {
            const parentId = stop.studentId.parent._id;
            const parentLocation = stop.studentId.parent.location;
            
            if (parentLocation?.coordinates && 
                parentLocation.coordinates.length === 2) {
                
              // Group by parent location
              const locationKey = `${parentLocation.coordinates[1]},${parentLocation.coordinates[0]}`;
              
              if (!parentLocationsMap.has(locationKey)) {
                parentLocationsMap.set(locationKey, {
                  location: parentLocation,
                  students: [],
                  stops: []
                });
              }
              
              // Add this student to the location
              parentLocationsMap.get(locationKey).students.push(stop.studentId);
              parentLocationsMap.get(locationKey).stops.push(stop);
              
            }
          } else if (stop.type === "school") {
            // Handle school stop separately - already done above
          } else {
            console.log(`Stop ${index} has no location data`);
          }
        } catch (stopError) {
          console.error(`Error processing stop at index ${index}:`, stopError);
        }
      });

      // Add parent locations to coordinates with better validation
      parentLocationsMap.forEach((locationData, locationKey) => {
        try {
          const location = locationData.location;
          if (!location.coordinates) {
            return;
          }

          if (
            !Array.isArray(location.coordinates) ||
            location.coordinates.length !== 2
          ) {
            invalidCoordinates.push({
              locationKey,
              coordinates: location.coordinates,
            });
            return;
          }

          const [longitude, latitude] = location.coordinates;

          if (typeof latitude !== "number" || typeof longitude !== "number") {
            invalidCoordinates.push({
              locationKey,
              coordinates: location.coordinates,
            });
            return;
          }

          // Validate coordinates are in proper range
          if (
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
          ) {
            invalidCoordinates.push({
              locationKey,
              coordinates: [longitude, latitude],
            });
            return;
          }

          coordinates.push({
            latitude,
            longitude,
          });
          
          // Add to stopDataMap
          newStopDataMap.set(locationKey, {
            type: "pickup",
            students: locationData.students,
            stops: locationData.stops,
            address: location.place || "Pickup Point"
          });
         
        } catch (locationError) {
          console.error(`Error processing location:`, locationError);
        }
      });

      if (invalidCoordinates.length > 0) {
        console.log("Invalid coordinates found:", invalidCoordinates);
      }

      // Save stop data map
      setStopDataMap(newStopDataMap);

      // If we have at least one valid coordinate
      if (coordinates.length > 0) {
        setStopCoordinates(coordinates);

        // Set initial region based on first coordinate
        setInitialRegion({
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        // Now fetch alternative routes that all include all stops
        if (coordinates.length >= 2 && mapsKey) {
          try {
            // Get route alternatives
            const routeAlts = await fetchAlternativeRoutes(
              coordinates,
              mapsKey
            );
            if (routeAlts.length > 0) {
              setRouteAlternatives(routeAlts);
              // Show route selector if we have multiple options
              if (routeAlts.length > 1) {
                setShowRouteSelector(true);
              }
            } else {
              // Fallback to a single route if no alternatives were generated
              const fallbackRoute = await fetchRouteWithWaypoints(
                coordinates[0],
                coordinates[coordinates.length - 1],
                coordinates.slice(1, -1),
                mapsKey,
                "Route"
              );

              if (fallbackRoute) {
                setRouteAlternatives([
                  {
                    id: "fallback",
                    paths: [fallbackRoute],
                    isSelected: true,
                    summary: "All Stops",
                    totalDistance: fallbackRoute.distance,
                    totalDuration: fallbackRoute.duration,
                  },
                ]);
              }
            }
          } catch (routeError) {
            console.error("Error fetching route alternatives:", routeError);
          }
        }
      } else {
        console.log("No valid coordinates found");
        setError("No valid location data available");
      }
    } catch (processError) {
      console.error("Error in processRouteData:", processError);
      setError("Failed to process route data");
    } finally {
      setRouteLoading(false);
    }
  };

  const handleMapError = () => {
    console.log("Map error occurred");
    // Fall back to simple direct lines if there's an error with directions
    Alert.alert(
      "Map Error",
      "There was an error loading the route. Showing direct paths instead.",
      [{ text: "OK" }]
    );
  };

  const renderMarker = (
    coord: Coordinates,
    index: number,
    isStop: boolean = true
  ) => {
    try {
      const coordKey = `${coord.latitude},${coord.longitude}`;
      const locationData = stopDataMap.get(coordKey);
      
      if (!locationData) {
        return null;
      }
      
      const isSchool = locationData.type === "school";
      const students = locationData.students || [];
      
      // For school stops, we'll have a different approach
      if (isSchool) {
        const stopData = locationData.stopData;
        
        return (
          <Marker
            key={`marker-${index}-${coord.latitude}-${coord.longitude}`}
            coordinate={coord}
            title={"School"}
            identifier={`marker-${index}`}
            tracksViewChanges={false}
            pinColor={"green"}
            onPress={() => {
              if (tripData?.status !== "in_progress") {
                Toast.show({
                  type: "info",
                  text1: "Trip Status Update Required",
                  text2: "Trip must be in progress to update stops",
                  position: "bottom",
                });
                return;
              }
              
              setSelectedStop(stopData);
              setSelectedStudent(null);
              setModalVisible(true);
            }}
          />
        );
      }
      
      // For regular stops with students
      return (
        <Marker
          key={`marker-${index}-${coord.latitude}-${coord.longitude}`}
          coordinate={coord}
          title={`${students.length} students`}
          description={locationData.address}
          identifier={`marker-${index}`}
          tracksViewChanges={false}
          pinColor={"red"}
          onPress={() => {
            if (tripData?.status !== "in_progress") {
              Toast.show({
                type: "info",
                text1: "Trip Status Update Required",
                text2: "Trip must be in progress to update stops",
                position: "bottom",
              });
              return;
            }
            
            if (students.length > 1) {
              // Multiple students - show student selection modal
              setSelectedStop(locationData.stops[0]); // Use first stop for this location
              setStudentsToSelect(students);
              setStudentSelectionVisible(true);
            } else if (students.length === 1) {
              // Single student - update directly
              setSelectedStop(locationData.stops[0]);
              setSelectedStudent(students[0]);
              setModalVisible(true);
            }
          }}
        />
      );
    } catch (error) {
      console.error(`Error rendering marker ${index}:`, error);
      return null;
    }
  };

  const handleStudentSelection = (stop, student) => {
    setSelectedStop(stop);
    setSelectedStudent(student);
    setModalVisible(true);
  };

  const handleRouteSelect = (routeId: string) => {
    // Update selected route
    const updatedRoutes = routeAlternatives.map((route) => ({
      ...route,
      isSelected: route.id === routeId,
    }));

    setRouteAlternatives(updatedRoutes);

    // Find selected route to zoom to its bounds
    const selectedRoute = updatedRoutes.find((r) => r.id === routeId);
    if (selectedRoute && mapRef.current && selectedRoute.paths.length > 0) {
      const points = selectedRoute.paths[0].points;
      if (points.length > 0) {
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }
    }
  };

  const handleRetry = () => {
    Alert.alert(
      "Retry Loading Map",
      "Would you like to try loading the map data again?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Retry", onPress: fetchTripData },
      ]
    );
  };

  const toggleRouteSelector = () => {
    setShowRouteSelector(!showRouteSelector);
  };
  
  // Handle stop updates
  const handleStopUpdateSuccess = () => {
    // Refresh trip data after updating a stop
    fetchTripData();
    
    // Show toast
    Toast.show({
      type: "success",
      text1: "Status Updated",
      text2: selectedStudent ? `${selectedStudent.name}'s status has been updated` : "Stop status has been updated",
      position: "bottom",
      visibilityTime: 1000,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading route map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedRouteAlt = routeAlternatives.find((route) => route.isSelected);
  return (
    <View style={styles.container}>
      {initialRegion ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onError={handleMapError}
        >
          {/* Render road-based route paths for selected alternative */}
          {selectedRouteAlt?.paths.map((path, pathIndex) => (
            <Polyline
              key={`path-${selectedRouteAlt.id}-${pathIndex}`}
              coordinates={path.points}
              strokeWidth={4}
              strokeColor={COLORS.primary}
              geodesic={true}
            />
          ))}

          {/* Fallback to direct line if no directions available */}
          {(!selectedRouteAlt || selectedRouteAlt.paths.length === 0) &&
            stopCoordinates.length >= 2 && (
              <Polyline
                coordinates={stopCoordinates}
                strokeWidth={4}
                strokeColor={COLORS.primary}
                strokeDashPattern={[5, 5]} // Dashed line for direct route
                geodesic={true}
              />
            )}

          {/* Only render markers after delay to prevent errors */}
          {markersReady &&
            stopCoordinates.map((coord, index) => renderMarker(coord, index))}
        </MapView>
      ) : (
        <View style={styles.noDataContainer}>
          <Feather name="map-pin" size={48} color={COLORS.gray} />
          <Text style={styles.noDataText}>No map data available</Text>
        </View>
      )}

      {/* Show route loading indicator */}
      {routeLoading && (
        <View style={styles.routeLoadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.routeLoadingText}>Getting best routes...</Text>
        </View>
      )}

      {/* Route alternatives selector */}
      <RouteSelector
        routes={routeAlternatives}
        onSelect={handleRouteSelect}
        onClose={toggleRouteSelector}
        isVisible={showRouteSelector && !routeLoading && routeAlternatives.length > 0}
        routeColors={ROUTE_COLORS}
      />

      {/* Route selector toggle button */}
      {!showRouteSelector && !routeLoading && routeAlternatives.length > 1 && (
        <TouchableOpacity
          style={styles.routeToggleButton}
          onPress={toggleRouteSelector}
        >
          <Feather name="map" size={20} color={COLORS.white} />
          <Text style={styles.routeToggleText}>Show Routes</Text>
        </TouchableOpacity>
      )}

      {/* Trip status controls */}
      {tripData && (
        <TripStatusControls
          tripStatus={tripData.status}
          onStatusChange={handleTripStatusChange}
        />
      )}

      {tripData && (
        <View style={styles.tripInfoOverlay}>
          <Text style={styles.tripInfoTitle}>
            {tripData.routeId?.name || "Route"} (
            {tripData.direction === "afternoon" ? "Afternoon" : "Morning"})
          </Text>
          <Text style={styles.tripInfoDetails}>
            Trip ID: {tripId.substring(0, 8)}...
          </Text>
          <Text style={styles.tripInfoDetails}>
            Stops: {stopCoordinates.length}
          </Text>
          {selectedRouteAlt && (
            <Text style={styles.tripInfoDetails}>
              Distance: {selectedRouteAlt.totalDistance.toFixed(1)} km •
              Duration: {Math.round(selectedRouteAlt.totalDuration)} min
            </Text>
          )}
        </View>
      )}
      
      {/* Student Selection Modal */}
      {studentSelectionVisible && (
        <StudentSelectionModal
          visible={studentSelectionVisible}
          onClose={() => setStudentSelectionVisible(false)}
          students={studentsToSelect}
          onSelectStudent={handleStudentSelection}
          stop={selectedStop}
        />
      )}
      
      {/* Stop Action Modal */}
      {selectedStop && (
        <StopActionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          stop={selectedStop}
          student={selectedStudent}
          tripId={tripId}
          onUpdateSuccess={handleStopUpdateSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  tripInfoOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: SIZES.borderRadius,
    padding: SIZES.s,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tripInfoTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
  },
  tripInfoDetails: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.m,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SIZES.m,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.error,
    marginTop: SIZES.m,
    marginBottom: SIZES.m,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.s,
    paddingHorizontal: SIZES.m,
    borderRadius: SIZES.borderRadius,
  },
  retryButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  noDataText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.m,
  },
  routeLoadingOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: SIZES.borderRadius,
    padding: SIZES.s,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  routeLoadingText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  routeSelectorContainer: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: SIZES.borderRadius,
    padding: SIZES.s,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  routeSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.xs,
  },
  routeSelectorTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.body2,
    color: COLORS.text,
  },
  routeOption: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.s,
    marginRight: SIZES.s,
    borderLeftWidth: 4,
    minWidth: 180,
    maxWidth: 250,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeOptionSelected: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  routeOptionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.body3,
    color: COLORS.text,
    marginBottom: 2,
  },
  routeOptionDetail: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
  },
  routeToggleButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.s,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  routeToggleText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
    marginLeft: SIZES.xs,
  },
  // Trip status controls styles
  tripStatusContainer: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: SIZES.borderRadius,
    padding: SIZES.s,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusHeading: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  currentStatus: {
    fontFamily: FONTS.bold,
    textTransform: 'capitalize',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.s,
    borderRadius: SIZES.borderRadius,
    marginRight: SIZES.xs,
  },
  statusButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body4,
    color: COLORS.white,
    marginLeft: SIZES.xs,
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.m,
  },
  modalHeader: {
    marginBottom: SIZES.m,
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  modalSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  modalLoading: {
    marginVertical: SIZES.m,
  },
  modalButtons: {
    marginBottom: SIZES.m,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.s,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.s,
  },
  modalButtonIcon: {
    marginRight: SIZES.xs,
  },
  modalButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
  },
  closeButton: {
    paddingVertical: SIZES.s,
    alignItems: "center",
    backgroundColor: `${COLORS.gray}20`,
    borderRadius: SIZES.borderRadius,
  },
  closeButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
  },
  missedButton: {
    backgroundColor: COLORS.error,
  },
  cancelledButton: {
    backgroundColor: COLORS.warning,
  },
  // Student selection styles
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.s,
    paddingHorizontal: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.gray}20`,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.s,
  },
  studentItemDetails: {
    flex: 1,
  },
  studentItemName: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
  },
  studentItemClass: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body4,
    color: COLORS.textSecondary,
  },
});

export default DriverMapScreen;