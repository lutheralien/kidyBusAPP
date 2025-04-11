import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from "react-native";
import { Card } from "../../components/common";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import { ROUTES } from "../../constants/routes";
import { ParentNavigationProp } from "../../types/navigation.types";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getUserProfile } from "../../store/slices/userSlice";
import { getStudentsAssignedToParent, getRoutes } from "@/src/api/api.service";
import * as Location from "expo-location";
import { Feather, MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { setUserLocation } from "../../store/slices/configSlice";
import LocationDropdown from "@/src/components/common/LocationDropdown";
import { IStudent } from "@/src/custom";

// Define the Route and Stop types based on the API response
interface Coordinates {
  type: string;
  coordinates: number[];
}

interface Stop {
  coordinates: Coordinates;
  stopId: string;
  type: string;
  studentId?: string;
  address: string;
  estimatedTime: string;
  sequence: number;
  _id: string;
}

interface Driver {
  _id: string;
  name: string;
  phone: string;
}

interface Route {
  _id: string;
  name: string;
  direction: "morning" | "afternoon";
  driverId: Driver;
  schoolId: string;
  stops: Stop[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ParentDashboardScreenProps {
  navigation: ParentNavigationProp<typeof ROUTES.PARENT_DASHBOARD>;
}

const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const { profile, status } = useAppSelector((state) => state.user);
  const userLocation = useAppSelector((state) => state.config.userLocation);

  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<IStudent[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState<string>("");
  const [isLocationDropdownVisible, setIsLocationDropdownVisible] =
    useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);

  // Load user profile, student data, routes, and location on component mount
  useEffect(() => {
    if (user?._id) {
      dispatch(getUserProfile(user._id));
      fetchStudents();
      fetchRoutes();
      handleLocationSetup();
    }
  }, [dispatch, user]);

  // Fetch students assigned to the parent
  const fetchStudents = async () => {
    if (!user?._id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getStudentsAssignedToParent(user._id);

      if (response.data.success) {
        setStudents(response.data.data);
      } else {
        setError("Failed to fetch students data");
      }
    } catch (err) {
      setError("An error occurred while fetching students");
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch routes
  const fetchRoutes = async () => {
    setRoutesLoading(true);
    setRoutesError(null);

    try {
      const response = await getRoutes();

      if (response.data.success) {
        setRoutes(response.data.data);
      } else {
        setRoutesError("Failed to fetch routes data");
      }
    } catch (err) {
      setRoutesError("An error occurred while fetching routes");
      console.error("Error fetching routes:", err);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Handle location setup
  const handleLocationSetup = async () => {
    try {
      setIsLocationLoading(true);
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermissionStatus(status);

      if (status === "granted") {
        await getCurrentLocation();
      } else {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        setLocationPermissionStatus(newStatus);

        if (newStatus === "granted") {
          await getCurrentLocation();
        } else {
          showLocationPermissionAlert();
        }
      }
    } catch (error) {
      console.error("Error setting up location:", error);
      showLocationPermissionAlert();
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Get the current location
  const getCurrentLocation = async () => {
    try {
      setIsLocationLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (response[0]) {
        const address = response[0];
        const formattedAddress = [
          address.street,
          address.district,
          address.city,
          address.region,
        ]
          .filter(Boolean)
          .join(", ");

        dispatch(
          setUserLocation({
            type: "Point",
            coordinates: [longitude, latitude],
            place: formattedAddress,
          })
        );
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      showLocationPermissionAlert();
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Show location permission alert
  const showLocationPermissionAlert = () => {
    Alert.alert(
      "Location Access",
      "We need location access to provide better service for your children. Would you like to set your location manually?",
      [
        {
          text: "Not Now",
          style: "cancel",
        },
        {
          text: "Open Settings",
          onPress: () => Linking.openSettings(),
        },
        {
          text: "Set Manually",
          onPress: () => setIsLocationDropdownVisible(true),
        },
      ]
    );
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    dispatch(
      setUserLocation({
        ...location,
        type: "Point",
      })
    );
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    if (user?._id) {
      setRefreshing(true);
      await Promise.all([
        dispatch(getUserProfile(user._id)),
        fetchStudents(),
        fetchRoutes(),
        getCurrentLocation(),
      ]);
      setRefreshing(false);
    }
  };

  // Navigate to student details screen
  const navigateToStudentDetails = (student: Student) => {
    navigation.navigate(ROUTES.STUDENT_DETAILS, {
      studentId: student._id,
      studentName: student.name,
    });
  };

  // Navigate to route details screen
  const navigateToRouteDetails = (route: Route) => {
    navigation.navigate(ROUTES.ROUTE_DETAILS, {
      routeId: route._id,
      routeName: route.name,
    });
  };

  // Find routes relevant to a student
  const findStudentRoutes = (
    studentId: string
  ): { morningRoute?: Route; afternoonRoute?: Route } => {
    const morningRoute = routes.find(
      (route) =>
        route.direction === "morning" &&
        route.stops.some((stop) => stop.studentId === studentId)
    );

    const afternoonRoute = routes.find(
      (route) =>
        route.direction === "afternoon" &&
        route.stops.some((stop) => stop.studentId === studentId)
    );

    return { morningRoute, afternoonRoute };
  };

  // Find the estimated time for a student's stop in a route
  const findStudentStopTime = (
    route: Route | undefined,
    studentId: string
  ): string => {
    if (!route) return "Not scheduled";

    const studentStop = route.stops.find(
      (stop) => stop.studentId === studentId
    );
    return studentStop ? studentStop.estimatedTime : "Not found";
  };

  // Format time to AM/PM
  const formatTime = (time: string): string => {
    if (!time || time === "Not scheduled" || time === "Not found") return time;

    // Parse the time (assuming format is "HH:MM")
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert to 12-hour format

    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Get status label based on time
  const getStatusLabel = (timeStr: string): string => {
    if (!timeStr || timeStr === "Not scheduled" || timeStr === "Not found")
      return "Not scheduled";

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const [hours, minutes] = timeStr.split(":").map(Number);

    // Convert to minutes for easier comparison
    const timeInMinutes = hours * 60 + minutes;
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    // Check if within 15 minutes before scheduled time
    if (
      timeInMinutes - currentTimeInMinutes <= 15 &&
      timeInMinutes - currentTimeInMinutes > 0
    ) {
      return "Arriving soon";
    }
    // Check if within 15 minutes after scheduled time
    else if (
      currentTimeInMinutes - timeInMinutes <= 15 &&
      currentTimeInMinutes - timeInMinutes >= 0
    ) {
      return "In progress";
    }
    // Check if more than 15 minutes after scheduled time
    else if (currentTimeInMinutes - timeInMinutes > 15) {
      return "Completed";
    }
    // Default case: scheduled
    else {
      return "Scheduled";
    }
  };

  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate a consistent color based on string
  const getColorFromString = (str: string): string => {
    const colors = [
      "#4F46E5", // Indigo
      "#7C3AED", // Violet
      "#EC4899", // Pink
      "#F59E0B", // Amber
      "#10B981", // Emerald
      "#0EA5E9", // Sky
      "#8B5CF6", // Purple
      "#EF4444", // Red
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  // Get status color based on status label
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Arriving soon":
        return "#F59E0B"; // Amber
      case "In progress":
        return "#10B981"; // Green
      case "Completed":
        return "#6B7280"; // Gray
      case "Scheduled":
        return "#4F46E5"; // Indigo
      default:
        return "#9CA3AF"; // Light Gray
    }
  };

  // Get a transportation summary for a student
  const getTransportationSummary = (student: Student) => {
    const { morningRoute, afternoonRoute } = findStudentRoutes(student._id);
    
    if (!morningRoute && !afternoonRoute) {
      return {
        hasTransportation: false,
        status: "No transportation",
        statusColor: "#9CA3AF",
      };
    }
    
    const morningTime = findStudentStopTime(morningRoute, student._id);
    const afternoonTime = findStudentStopTime(afternoonRoute, student._id);
    
    // Determine which route is more relevant based on current time
    const now = new Date();
    const currentHours = now.getHours();
    
    // After noon, afternoon routes are more relevant
    const relevantTime = currentHours >= 12 ? afternoonTime : morningTime;
    const relevantStatus = getStatusLabel(relevantTime);
    const relevantStatusColor = getStatusColor(relevantStatus);
    
    return {
      hasTransportation: true,
      status: relevantStatus,
      statusColor: relevantStatusColor,
      relevantTime: relevantTime !== "Not scheduled" ? formatTime(relevantTime) : null,
    };
  };

  // Show student details modal
  const showStudentDetails = (student: IStudent) => {
    setSelectedStudent(student);
  };


  // Render an improved transportation card for a student
  const renderTransportationCard = (student: IStudent) => {
    const { morningRoute, afternoonRoute } = findStudentRoutes(student._id);

    // Skip if no routes found for this student
    if (!morningRoute && !afternoonRoute) return null;

    const morningTime = findStudentStopTime(morningRoute, student._id);
    const afternoonTime = findStudentStopTime(afternoonRoute, student._id);

    const morningStatus = getStatusLabel(morningTime);
    const afternoonStatus = getStatusLabel(afternoonTime);

    const morningStatusColor = getStatusColor(morningStatus);
    const afternoonStatusColor = getStatusColor(afternoonStatus);

    // Get the morning and afternoon stop addresses
    const morningAddress = morningRoute?.stops.find(
      stop => stop.studentId === student._id
    )?.address || "Address not available";
    
    const afternoonAddress = afternoonRoute?.stops.find(
      stop => stop.studentId === student._id
    )?.address || "Address not available";

    return (
      <Card style={styles.transportCard} key={`transport-${student._id}`}>
        <View style={styles.transportCardHeader}>
          <View style={styles.transportCardTitle}>
            <View style={styles.busIconContainer}>
              <FontAwesome5 name="bus-alt" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.transportCardTitleText}>
              {student.name}'s Transportation
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => morningRoute && navigateToRouteDetails(morningRoute)}
          >
            <Text style={styles.viewAllText}>View Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transportDivider} />

        {/* Morning Route - Enhanced Card UI */}
        <View style={styles.routeSection}>
          <View style={styles.routeHeader}>
            <View style={styles.routeTypeContainer}>
              <MaterialIcons name="wb-sunny" size={16} color="#F59E0B" />
              <Text style={styles.routeType}>Morning Pickup</Text>
            </View>
            {morningTime !== "Not scheduled" && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${morningStatusColor}15` },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: morningStatusColor },
                  ]}
                />
                <Text
                  style={[styles.statusText, { color: morningStatusColor }]}
                >
                  {morningStatus}
                </Text>
              </View>
            )}
          </View>

          {morningRoute ? (
            <View style={styles.enhancedRouteDetails}>
              <View style={styles.routeTimeContainer}>
                <View style={styles.routeTimeBox}>
                  <Text style={styles.routeTimeValue}>{formatTime(morningTime)}</Text>
                  <Text style={styles.routeTimeLabel}>Pickup Time</Text>
                </View>
                
                <View style={styles.routeDetailsList}>
                  <View style={styles.routeDetailItem}>
                    <Ionicons name="person" size={16} color={COLORS.textSecondary} style={styles.detailIcon} />
                    <Text style={styles.routeDetailLabel}>Driver:</Text>
                    <Text style={styles.routeDetailValue}>
                      {morningRoute.driverId.name}
                    </Text>
                  </View>
                  
                  <View style={styles.routeDetailItem}>
                    <Ionicons name="location" size={16} color={COLORS.textSecondary} style={styles.detailIcon} />
                    <Text style={styles.routeDetailLabel}>Pickup:</Text>
                    <Text
                      style={styles.routeDetailValue}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {morningAddress}
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.callDriverButton}
                onPress={() => {
                  if (morningRoute.driverId.phone) {
                    Linking.openURL(`tel:${morningRoute.driverId.phone}`);
                  }
                }}
              >
                <Ionicons name="call" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noRouteContainer}>
              <Text style={styles.noRouteText}>No morning route scheduled</Text>
            </View>
          )}
        </View>

        <View style={styles.routeDivider} />

        {/* Afternoon Route - Enhanced Card UI */}
        <View style={styles.routeSection}>
          <View style={styles.routeHeader}>
            <View style={styles.routeTypeContainer}>
              <MaterialIcons name="wb-twilight" size={16} color="#8B5CF6" />
              <Text style={styles.routeType}>Afternoon Dropoff</Text>
            </View>
            {afternoonTime !== "Not scheduled" && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${afternoonStatusColor}15` },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: afternoonStatusColor },
                  ]}
                />
                <Text
                  style={[styles.statusText, { color: afternoonStatusColor }]}
                >
                  {afternoonStatus}
                </Text>
              </View>
            )}
          </View>

          {afternoonRoute ? (
            <View style={styles.enhancedRouteDetails}>
              <View style={styles.routeTimeContainer}>
                <View style={styles.routeTimeBox}>
                  <Text style={styles.routeTimeValue}>{formatTime(afternoonTime)}</Text>
                  <Text style={styles.routeTimeLabel}>Dropoff Time</Text>
                </View>
                
                <View style={styles.routeDetailsList}>
                  <View style={styles.routeDetailItem}>
                    <Ionicons name="person" size={16} color={COLORS.textSecondary} style={styles.detailIcon} />
                    <Text style={styles.routeDetailLabel}>Driver:</Text>
                    <Text style={styles.routeDetailValue}>
                      {afternoonRoute.driverId.name}
                    </Text>
                  </View>
                  
                  <View style={styles.routeDetailItem}>
                    <Ionicons name="location" size={16} color={COLORS.textSecondary} style={styles.detailIcon} />
                    <Text style={styles.routeDetailLabel}>Dropoff:</Text>
                    <Text
                      style={styles.routeDetailValue}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {afternoonAddress}
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.callDriverButton}
                onPress={() => {
                  if (afternoonRoute.driverId.phone) {
                    Linking.openURL(`tel:${afternoonRoute.driverId.phone}`);
                  }
                }}
              >
                <Ionicons name="call" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noRouteContainer}>
              <Text style={styles.noRouteText}>
                No afternoon route scheduled
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.contactDriverButton}
          onPress={() => {
            const driver = morningRoute?.driverId || afternoonRoute?.driverId;
            if (driver && driver.phone) {
              Linking.openURL(`tel:${driver.phone}`);
            }
          }}
        >
          <Feather
            name="phone"
            size={16}
            color={COLORS.white}
            style={styles.contactDriverIcon}
          />
          <Text style={styles.contactDriverText}>Contact Driver</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  // Render an improved student item
  const renderStudentItem = (student: Student) => {
    const avatarColor = getColorFromString(student._id);
    const initials = getInitials(student.name);
    const transportSummary = getTransportationSummary(student);
    
    // Get the routes information
    const { morningRoute, afternoonRoute } = findStudentRoutes(student._id);
    const hasRoutes = morningRoute || afternoonRoute;

    return (
      <TouchableOpacity
        key={student._id}
        style={styles.studentCard}
        onPress={() => navigateToStudentDetails(student)}
        activeOpacity={0.9}
      >
        <View style={styles.studentCardContent}>
          <View
            style={[styles.avatarContainer, { backgroundColor: avatarColor }]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <View style={styles.studentDetailRow}>
              <Text style={styles.detailLabel}>Grade:</Text>
              <Text style={styles.detailValue}>{student.class}</Text>
            </View>
            <View style={styles.studentDetailRow}>
              <Text style={styles.detailLabel}>ID:</Text>
              <Text style={styles.detailValue}>
                {student._id.substring(student._id.length - 6).toUpperCase()}
              </Text>
            </View>
            
            {/* Enhanced Status Display */}
            <View style={styles.enhancedStatusRow}>
              {student.status && (
                <View style={[styles.statusBadge, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                  <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
                  <Text style={[styles.statusText, { color: "#10B981" }]}>Active</Text>
                </View>
              )}
              
              {hasRoutes && (
                <View 
                  style={[
                    styles.statusBadge, 
                    { backgroundColor: `${transportSummary.statusColor}15`, marginLeft: SIZES.xs }
                  ]}
                >
                  <Ionicons name="bus-outline" size={12} color={transportSummary.statusColor} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusText, { color: transportSummary.statusColor }]}>
                    {transportSummary.status}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Enhanced Action Buttons */}
        <View style={styles.studentActionRow}>
          <TouchableOpacity 
            style={[styles.studentActionButton, styles.detailsButton]}
            onPress={() => navigateToStudentDetails(student)}
          >
            <Ionicons name="information-circle-outline" size={14} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          
          {hasRoutes && (
            <TouchableOpacity 
              style={[styles.studentActionButton, styles.routeButton]}
              onPress={() => {
                const route = morningRoute || afternoonRoute;
                if (route) {
                  navigateToRouteDetails(route);
                }
              }}
            >
              <Ionicons name="map-outline" size={14} color={COLORS.success} />
              <Text style={[styles.actionButtonText, { color: COLORS.success }]}>Route</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render the location display
  const renderLocationDisplay = () => {
    return (
      <TouchableOpacity
        style={[
          styles.locationDisplay,
          userLocation?.place
            ? styles.locationDisplayWithLocation
            : styles.locationDisplayWithoutLocation,
        ]}
        onPress={() => setIsLocationDropdownVisible(true)}
      >
        {isLocationLoading ? (
          <>
            <ActivityIndicator
              size="small"
              color={COLORS.white}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>Getting your location...</Text>
          </>
        ) : (
          <>
            <Feather
              name="map-pin"
              size={16}
              color={COLORS.white}
              style={styles.locationIcon}
            />
            <Text
              style={styles.locationText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userLocation?.place || "Set your location"}
            </Text>
            <View style={styles.locationEditBadge}>
              <Feather name="edit-2" size={12} color={COLORS.white} />
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <LocationDropdown
        isVisible={isLocationDropdownVisible}
        onClose={() => setIsLocationDropdownVisible(false)}
        currentAddress={userLocation?.place}
        currentLocation={userLocation}
        onSelectLocation={handleLocationSelect}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {user?.name || "Parent"}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            View transportation updates for your children
          </Text>

          {/* Location Display */}
          {renderLocationDisplay()}
        </Card>

        {/* Student Selection Quick Access */}
        {/* {!loading && !error && students.length > 1 && renderStudentSelectionCard()} */}

        {/* Transportation Cards */}
        {routesLoading && !refreshing ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Loading transportation information...
            </Text>
          </Card>
        ) : routesError ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{routesError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRoutes}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : students.length > 0 && routes.length > 0 ? (
          students.map((student) => renderTransportationCard(student))
        ) : (
          routes.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Routes Available</Text>
              <Text style={styles.emptyText}>
                There are no active transportation routes at this time.
              </Text>
            </Card>
          )
        )}

        {/* Students List */}
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="people" size={20} color={COLORS.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Your Children</Text>
          </View>
          <Text style={styles.childrenCount}>
            {students.length > 0
              ? `${students.length} ${
                  students.length === 1 ? "child" : "children"
                }`
              : ""}
          </Text>
        </View>

        {loading && !refreshing ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Loading your children's information...
            </Text>
          </Card>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchStudents}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : students.length > 0 ? (
          <View style={styles.studentGrid}>
            {students.map(renderStudentItem)}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Children Found</Text>
            <Text style={styles.emptyText}>
              You don't have any children registered in the system yet.
            </Text>
          </Card>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SIZES.m,
    paddingBottom: SIZES.xl,
  },
  welcomeCard: {
    backgroundColor: COLORS.primary,
    marginBottom: SIZES.m,
    borderRadius: SIZES.borderRadius * 1.5,
    padding: SIZES.m,
  },
  welcomeTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h3,
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  welcomeSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SIZES.m,
  },
  // Enhanced location display styles
  locationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SIZES.borderRadius,
    paddingVertical: SIZES.xs + 2,
    paddingHorizontal: SIZES.m,
    marginTop: SIZES.s,
    marginBottom: SIZES.xs,
  },
  locationDisplayWithLocation: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  locationDisplayWithoutLocation: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
  },
  locationIcon: {
    marginRight: SIZES.xs,
  },
  locationText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.white,
    flex: 1,
    marginRight: SIZES.xs,
  },
  locationEditBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 4,
  },
  // Quick selection scrollable cards
  selectionCard: {
    marginBottom: SIZES.m,
    padding: SIZES.s,
  },
  selectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.body2,
    color: COLORS.text,
    marginBottom: SIZES.s,
    marginLeft: SIZES.xs,
  },
  selectionScrollContent: {
    paddingHorizontal: SIZES.xs,
  },
  selectionItem: {
    alignItems: 'center',
    marginRight: SIZES.m,
    width: 80,
  },
  selectionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xs,
  },
  selectionAvatarText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.white,
  },
  selectionName: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  selectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  selectionStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  selectionStatusText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.caption,
  },
  // Transportation card styles
  transportCard: {
    marginBottom: SIZES.m,
    borderRadius: SIZES.borderRadius,
    padding: 0,
    overflow: "hidden",
  },
  transportCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    paddingVertical: SIZES.s,
    paddingHorizontal: SIZES.m,
  },
  transportCardTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  busIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SIZES.s,
  },
  transportCardTitleText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    flex: 1,
  },
  viewAllButton: {
    paddingHorizontal: SIZES.s,
    paddingVertical: SIZES.xs / 2,
    borderRadius: SIZES.borderRadius,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
  },
  viewAllText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body4,
    color: COLORS.primary,
  },
  transportDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginBottom: SIZES.m,
    marginHorizontal: SIZES.m,
  },
  routeSection: {
    marginBottom: SIZES.s,
    paddingHorizontal: SIZES.m,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.xs,
  },
  routeTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeType: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  // Enhanced route details
  enhancedRouteDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: SIZES.borderRadius / 2,
    padding: SIZES.s,
  },
  routeTimeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTimeBox: {
    alignItems: 'center',
    paddingRight: SIZES.m,
    marginRight: SIZES.m,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
  },
  routeTimeValue: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
  },
  routeTimeLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  routeDetailsList: {
    flex: 1,
  },
  routeDetailItem: {
    flexDirection: "row",
    alignItems: 'center',
    marginBottom: SIZES.xs / 2,
  },
  detailIcon: {
    marginRight: 4,
  },
  routeDetailLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
    width: 60,
  },
  routeDetailValue: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body3,
    color: COLORS.text,
    flex: 1,
  },
  callDriverButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Old styles below
  routeDetails: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: SIZES.borderRadius / 2,
    padding: SIZES.s,
  },
  noRouteContainer: {
    padding: SIZES.s,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: SIZES.borderRadius / 2,
    alignItems: "center",
  },
  noRouteText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
  },
  routeDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginVertical: SIZES.s,
  },
  contactDriverButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.s,
    marginTop: SIZES.s,
    marginHorizontal: SIZES.m,
    marginBottom: SIZES.m,
  },
  contactDriverIcon: {
    marginRight: SIZES.xs,
  },
  contactDriverText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
  },
  // Enhanced section header styles
  enhancedSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.m,
    paddingHorizontal: SIZES.xs,
    paddingVertical: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: SIZES.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
  },
  childrenCount: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
  },
  studentGrid: {
    marginBottom: SIZES.m,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.m,
    padding: SIZES.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  studentCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SIZES.m,
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.white,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  studentDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.xs / 2,
  },
  detailLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
    width: 45,
  },
  detailValue: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body3,
    color: COLORS.text,
  },
  // Enhanced status row
  enhancedStatusRow: {
    flexDirection: 'row',
    marginTop: SIZES.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body4,
  },
  // Enhanced action buttons row
  studentActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: SIZES.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: SIZES.s,
  },
  studentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.s,
    borderRadius: SIZES.borderRadius,
    marginRight: SIZES.s,
  },
  detailsButton: {
    backgroundColor: `${COLORS.primary}15`,
  },
  routeButton: {
    backgroundColor: `${COLORS.success}15`,
  },
  actionButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body4,
    color: COLORS.primary,
    marginLeft: 4,
  },
  // Loading, error and empty states
  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: SIZES.l,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.m,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.s,
    textAlign: "center",
  },
  errorCard: {
    padding: SIZES.m,
    alignItems: "center",
    borderRadius: SIZES.borderRadius,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    marginBottom: SIZES.m,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: SIZES.m,
  },
  retryButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.m,
    paddingVertical: SIZES.s,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.primary,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: SIZES.l,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.m,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.s,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});

export default ParentDashboardScreen;