import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Card } from '../../components/common';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { getTripsForDriver, updateTripStatus } from '@/src/api/api.service';
import { Feather } from '@expo/vector-icons';
import moment from 'moment';
import TripTimeline from '@/src/components/driver/TripTimeline';

// Import the Trip interface from wherever your TripTimeline component is exporting it
// If it's not exported directly, you can define it here
interface Parent {
  _id: string;
  name: string;
  phone: string;
  location?: {
    type: string;
    coordinates: number[];
    place: string;
  };
}

interface Student {
  _id: string;
  name: string;
  class: string;
  parent: Parent;
  stopStatus?: string;
  actualTime?: string;
  _stopId?: string;
}

interface Stop {
  stopId: string;
  type?: "pickup" | "dropoff" | "school";
  address?: string;
  coordinates?: {
    type: string;
    coordinates: number[];
  };
  plannedTime: string;
  actualTime?: string;
  status?: string;
  sequence: number;
  _id: string;
  studentId?: Student;
  students?: Student[];
}

interface RouteInfo {
  _id: string;
  name: string;
  direction: "morning" | "afternoon";
}

interface Trip {
  _id: string;
  routeId: RouteInfo;
  driverId: string;
  date: string;
  direction: "morning" | "afternoon";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  stops: Stop[];
  createdAt: string;
  updatedAt: string;
}

type TripAction = 'start' | 'complete' | 'cancel';

const DriversTodaysTripsScreen = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter trips for morning and afternoon
  const morningTrips = trips.filter(trip => trip.direction === 'morning');
  const afternoonTrips = trips.filter(trip => trip.direction === 'afternoon');

  useEffect(() => {
    if (user?._id) {
      fetchTrips();
    }
  }, [user]);

  const fetchTrips = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTripsForDriver(user._id);

      if (response.data.success) {
        setTrips(response.data.data);
      } else {
        console.error("API returned error:", response.data);
        setError('Failed to fetch trips');
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('An error occurred while fetching trips');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const getTodayDateString = () => {
    return moment().format('dddd, MMMM D, YYYY');
  };

  // Handle trip action (start, complete, or cancel)
  const handleTripAction = (tripId: string, action: TripAction) => {
    // Show confirmation dialog
    const title = action === 'start' 
      ? 'Start Trip' 
      : action === 'complete' 
        ? 'Complete Trip' 
        : 'Cancel Trip';
      
    const message = action === 'start' 
      ? 'Are you sure you want to start this trip?' 
      : action === 'complete'
        ? 'Are you sure you want to mark this trip as completed?'
        : 'Are you sure you want to cancel this trip?';
    
    Alert.alert(
      title,
      message,
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => console.log("Trip action cancelled by user")
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              console.log(`Confirmed ${action} action for trip ${tripId}`);
              
              // Update trip status on the server
              const status = action === 'start' 
                ? 'in_progress' 
                : action === 'complete' 
                  ? 'completed' 
                  : 'cancelled';
              
              console.log(`Sending updateTripStatus request to server:`, {
                tripId,
                status
              });
                  
              await updateTripStatus(tripId, status);
              // Update trip status locally
              const updatedTrips = trips.map(trip => {
                if (trip._id === tripId) {
                  return {
                    ...trip,
                    status: status as Trip['status']
                  };
                }
                return trip;
              });
              
              setTrips(updatedTrips);
              
              // Show success message
              Alert.alert(
                'Success',
                `Trip ${
                  action === 'start' 
                    ? 'started' 
                    : action === 'complete' 
                      ? 'completed' 
                      : 'cancelled'
                } successfully.`
              );
            } catch (error) {
              console.error(`Error ${action}ing trip:`, error);
              Alert.alert('Error', `Failed to ${action} trip. Please try again.`);
            }
          }
        }
      ]
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Trips</Text>
        <Text style={styles.subtitle}>{getTodayDateString()}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading trips...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTrips}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : trips.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="calendar" size={40} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Trips Today</Text>
            <Text style={styles.emptyText}>You don't have any scheduled trips for today.</Text>
          </Card>
        ) : (
          <>
            {/* Morning Trips Section */}
            {morningTrips.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Feather name="sunrise" size={18} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Morning Trips</Text>
                </View>
                
                {morningTrips.map(trip => (
                  <TripTimeline 
                    key={`morning-${trip._id}`} 
                    trip={trip} 
                    onTripAction={handleTripAction}
                    onRefresh={handleRefresh}
                  />
                ))}
              </View>
            )}
            
            {/* Afternoon Trips Section */}
            {afternoonTrips.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Feather name="sunset" size={18} color="#8B5CF6" />
                  <Text style={styles.sectionTitle}>Afternoon Trips</Text>
                </View>
                
                {afternoonTrips.map(trip => (
                  <TripTimeline 
                    key={`afternoon-${trip._id}`} 
                    trip={trip} 
                    onTripAction={handleTripAction}
                    onRefresh={handleRefresh}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h2,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: SIZES.m,
    paddingBottom: SIZES.xxl,
  },
  sectionContainer: {
    marginBottom: SIZES.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.s,
    paddingHorizontal: SIZES.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  
  // Loading, error and empty states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.m,
  },
  errorCard: {
    padding: SIZES.m,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.m,
  },
  retryButton: {
    paddingVertical: SIZES.s,
    paddingHorizontal: SIZES.m,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
  },
  retryText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
  },
  emptyCard: {
    padding: SIZES.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginTop: SIZES.m,
    marginBottom: SIZES.s,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default DriversTodaysTripsScreen;