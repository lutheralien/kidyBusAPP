// src/screens/admin/AdminDashboardScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Card } from "../../components/common";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import { ROUTES } from "../../constants/routes";
import { DriverNavigationProp } from "../../types/navigation.types";
import { useAuth } from "../../hooks/useAuth";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import LocationDropdown from "@/src/components/common/LocationDropdown";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setUserLocation } from "../../store/slices/configSlice";
import { RootState } from "@/src/store/store";

interface DriverDashboardScreenProps {
  navigation: DriverNavigationProp<typeof ROUTES.DRIVER_DASHBOARD>;
}

const DriverDashboardScreen: React.FC<DriverDashboardScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const userLocation = useAppSelector((state:RootState) => state.config.userLocation);

  const [refreshing, setRefreshing] = useState(false);

  // Location related states
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState<string>("");
  const [isLocationDropdownVisible, setIsLocationDropdownVisible] =
    useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Initialize location on component mount
  useEffect(() => {
    handleLocationSetup();
  }, []);

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
      "We need location access to provide better service. Would you like to set your location manually?",
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
    setRefreshing(true);
    await getCurrentLocation();
    setRefreshing(false);
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
            Welcome, {user?.name || "Admin"}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Here's an overview of your application
          </Text>

          {/* Location Display */}
          {renderLocationDisplay()}
        </Card>
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
  },
  welcomeCard: {
    backgroundColor: COLORS.primary,
    marginBottom: SIZES.m,
    padding: SIZES.m,
    borderRadius: SIZES.borderRadius,
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
    opacity: 0.8,
    marginBottom: SIZES.s,
  },
  // Location display styles
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
  locationStatusCard: {
    marginBottom: SIZES.m,
    padding: SIZES.m,
    borderRadius: SIZES.borderRadius,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.m,
  },
  systemStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.s,
    paddingVertical: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.extraLightGray,
  },
  systemStatusLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.text,
  },
  systemStatusIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  systemStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SIZES.xs,
  },
  statusGreen: {
    backgroundColor: COLORS.success,
  },
  statusYellow: {
    backgroundColor: COLORS.warning,
  },
  statusRed: {
    backgroundColor: COLORS.error,
  },
  systemStatusText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
  },
  setupLocationButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    paddingVertical: SIZES.s,
    paddingHorizontal: SIZES.m,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.m,
  },
  setupLocationText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
  },
});

export default DriverDashboardScreen;
