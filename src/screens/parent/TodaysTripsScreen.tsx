import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  Platform,
  Animated,
  Image
} from 'react-native';
import { getTripsForParent } from '@/src/api/api.service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import { Trip } from './tripUtils';
import { Card } from '@/src/components/common';
import { COLORS, SIZES, FONTS } from '@/src/constants/theme';
import { SOCKET_URL, ESocketEvents } from '@/src/custom';
import useAuth from '@/src/hooks/useAuth';
import JourneyTimeline from './JourneyComponent';

const TodaysTripsScreen = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const appState = useRef(AppState.currentState);
  
  // Animation value for connection indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation for the live indicator
  useEffect(() => {
    if (socketConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [socketConnected, pulseAnim]);

  // Filter trips for morning and afternoon
  const morningTrips = trips.filter(trip => trip.direction === 'morning');
  const afternoonTrips = trips.filter(trip => trip.direction === 'afternoon');

  const handleAppStateChange = useCallback((nextAppState: string) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      reconnectSocket();
    } else if (nextAppState.match(/inactive|background/)) {
      // App has gone to the background
      socketRef.current?.disconnect();
      setSocketConnected(false);
    }
    appState.current = nextAppState;
  }, []);

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
      console.log('Socket connected');
      setSocketConnected(true);
      
      // Emit parent connection event
      socketRef.current?.emit(ESocketEvents.PARENT_CONNECT, { id: user._id });
      
      Toast.show({
        type: 'success',
        text1: 'Connected',
        text2: 'Real-time updates are now enabled',
        position: 'bottom',
        visibilityTime: 5000,
      });
    });

    // Handle socket connection error
    socketRef.current.on(ESocketEvents.CONNECT_ERROR, (error) => {
      console.log('Socket connection error:', error);
      setSocketConnected(false);
    });

    // Handle trip updates
    socketRef.current.on(ESocketEvents.TRIP_UPDATE, (data) => {
      console.log('Received trip update:', data);
      updateTripData(data);
      
      Toast.show({
        type: 'info',
        text1: 'Trip Update',
        text2: data.message || `Trip status updated to ${data.status}`,
        position: 'bottom',
      });
    });

    // Handle stop updates
    socketRef.current.on(ESocketEvents.STOP_UPDATE, (data) => {
      updateStopData(data);
      
      Toast.show({
        type: 'info',
        text1: 'Stop Update',    
        text2: data.message || `Stop status updated to ${data.status}`,
        position: 'bottom',
      });
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [user?._id]);

  // Function to update trip data when receiving a socket event
  const updateTripData = (data: any) => {
    setTrips(prevTrips => {
      return prevTrips.map(trip => {
        if (trip._id.toString() === data.tripId.toString()) {
          return {
            ...trip,
            status: data.status
          };
        }
        return trip;
      });
    });
  };

  // Function to update stop data when receiving a socket event
  // Enhanced updateStopData function for socket events
const updateStopData = (data: any) => {
  console.log('Stop update received:', data);
  
  setTrips(prevTrips => {
    return prevTrips.map(trip => {
      if (trip._id.toString() === data.tripId.toString()) {
        // Find and update the specific stop
        const updatedStops = trip.stops.map(stop => {
          if (stop.stopId === data.stopId) {
            // Check if students array exists
            if (stop.students && stop.students.length > 0) {
              // Find the exact index of the student in the students array
              const studentIndex = stop.students.findIndex(
                student => student._id.toString() === data.studentId.toString()
              );
              
              // Only proceed if we found the student
              if (studentIndex !== -1) {
                // Create a new status array based on the existing one
                let updatedStatus: string[] = [];
                
                // If status is already an array, copy it
                if (Array.isArray(stop.status)) {
                  updatedStatus = [...stop.status];
                } 
                // If it's a string, convert to array with the same status for all students
                else if (typeof stop.status === 'string') {
                  updatedStatus = stop.students.map(() => stop.status as string);
                }
                // If no status yet, create array of pending statuses
                else {
                  updatedStatus = stop.students.map(() => 'pending');
                }
                
                // Update the specific student's status
                updatedStatus[studentIndex] = data.status;
                
                console.log(`Updating status for student ${data.studentName} (index ${studentIndex}) to ${data.status}`);
                
                return {
                  ...stop,
                  status: updatedStatus,
                  actualTime: data.actualTime || stop.actualTime
                };
              }
            }
            
            // If no students array or student not found, just set the status directly
            return {
              ...stop,
              status: data.status,
              actualTime: data.actualTime || stop.actualTime
            };
          }
          return stop;
        });
        
        return {
          ...trip,
          stops: updatedStops
        };
      }
      return trip;
    });
  });
  
  // Show a toast message about the update
  const studentName = data.studentName || 'Student';
  const status = data.status || 'updated';
  
  Toast.show({
    type: 'info',
    text1: `${studentName} Status Update`,
    text2: `Status changed to: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    position: 'bottom',
    visibilityTime: 4000,
  });
};

  // Function to reconnect socket
  const reconnectSocket = () => {
    if (!socketConnected && user?._id) {
      setupSocket();
    }
  };

  // Fetch trips from API
  const fetchTrips = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTripsForParent(user._id);
      
      if (response.data.success) {
        setTrips(response.data.data);
      } else {
        setError('Failed to fetch trips');
      }
    } catch (err) {
      setError('An error occurred while fetching trips');
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    reconnectSocket();
    setRefreshing(false);
  };

  // Format current date
  const getTodayDateString = () => {
    return moment().format('dddd, MMMM D, YYYY');
  };

  // Get trip summary text
  const getTripSummaryText = () => {
    if (trips.length === 0) return 'No trips scheduled for today';
    
    return `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} today (${morningTrips.length} morning, ${afternoonTrips.length} afternoon)`;
  };

  // Initialize component
  useEffect(() => {
    if (user?._id) {
      fetchTrips();
      const cleanup = setupSocket();
      
      // Set up app state listener
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        cleanup();
        subscription.remove();
      };
    }
  }, [user, setupSocket, handleAppStateChange]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.enhancedHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Today's Trips</Text>
              <Text style={styles.subtitle}>{getTodayDateString()}</Text>
            </View>
            
            {/* Enhanced Live Status Indicator */}
            <View style={styles.liveStatusContainer}>
              {socketConnected ? (
                <View style={styles.liveStatusConnected}>
                  <Animated.View 
                    style={[
                      styles.liveDot, 
                      { transform: [{ scale: pulseAnim }] }
                    ]} 
                  />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.reconnectButton} 
                  onPress={reconnectSocket}
                >
                  <Feather name="refresh-cw" size={14} color={COLORS.white} />
                  <Text style={styles.reconnectText}>Reconnect</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Trip Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="bus" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.summaryText}>{getTripSummaryText()}</Text>
          </View>
        </View>
      </View>

      {/* Connection Status Banner (only when disconnected) */}
      {!socketConnected && (
        <TouchableOpacity 
          style={styles.connectionBanner}
          onPress={reconnectSocket}
        >
          <Feather name="wifi-off" size={16} color={COLORS.white} />
          <Text style={styles.connectionBannerText}>
            Live updates disconnected. Tap to reconnect.
          </Text>
        </TouchableOpacity>
      )}

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
            <Text style={styles.loadingText}>Loading your trips...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Feather name="alert-triangle" size={36} color={COLORS.error} style={styles.errorIcon} />
            <Text style={styles.errorTitle}>Unable to Load Trips</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTrips}>
              <Feather name="refresh-cw" size={16} color={COLORS.white} style={styles.retryIcon} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </Card>
        ) : trips.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text>NO TRIPS</Text>
            <Text style={styles.emptyTitle}>No Trips Today</Text>
            <Text style={styles.emptyText}>
              There are no scheduled trips for today. Pull down to refresh if you expect to see trips.
            </Text>
          </Card>
        ) : (
          <>
            {/* Morning Trips Section */}
            {morningTrips.length > 0 && (
              <View style={styles.tripSection}>
                {morningTrips.map(trip => (
                  <JourneyTimeline key={`morning-${trip._id}`} trip={trip} />
                ))}
              </View>
            )}
            
            {/* Afternoon Trips Section */}
            {afternoonTrips.length > 0 && (
              <View style={styles.tripSection}>
                {afternoonTrips.map(trip => (
                  <JourneyTimeline key={`afternoon-${trip._id}`} trip={trip} />
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
  // Enhanced header styles
  enhancedHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: SIZES.m,
    paddingBottom: SIZES.m,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: SIZES.m,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h2,
    color: COLORS.white,
    marginBottom: SIZES.xs / 2,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body3,
    color: 'rgba(255,255,255,0.8)',
  },
  // Live status styles
  liveStatusContainer: {
    alignItems: 'flex-end',
    marginLeft: SIZES.s,
  },
  liveStatusConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: SIZES.s,
    paddingVertical: SIZES.xs / 2,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SIZES.xs,
  },
  liveText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.caption,
    color: COLORS.success,
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: SIZES.s,
    paddingVertical: SIZES.xs / 2,
    borderRadius: 12,
  },
  reconnectText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.caption,
    color: COLORS.white,
    marginLeft: SIZES.xs / 2,
  },
  // Summary container
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: SIZES.m,
    padding: SIZES.s,
    borderRadius: SIZES.s,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.s,
  },
  summaryText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
    flex: 1,
  },
  // Connection banner
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.m,
    justifyContent: 'center',
  },
  connectionBannerText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
    marginLeft: SIZES.xs,
  },
  // ScrollView styles
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: SIZES.m,
    paddingBottom: SIZES.xxl,
  },
  // Section headers
  tripSection: {
    marginBottom: SIZES.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.s,
    paddingHorizontal: SIZES.xs,
    paddingVertical: SIZES.xs,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: SIZES.s,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  tripCountBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SIZES.s,
    paddingVertical: SIZES.xs / 2,
    borderRadius: 12,
    minWidth: 22,
    alignItems: 'center',
  },
  tripCountText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.body4,
    color: COLORS.primary,
  },
  // Loading state
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.m,
    textAlign: 'center',
  },
  // Error state
  errorCard: {
    padding: SIZES.l,
    alignItems: 'center',
    backgroundColor: `${COLORS.error}05`,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: `${COLORS.error}20`,
    marginBottom: SIZES.m,
  },
  errorIcon: {
    marginBottom: SIZES.s,
  },
  errorTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.error,
    marginBottom: SIZES.xs,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.m,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.s,
    paddingHorizontal: SIZES.m,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
  },
  retryIcon: {
    marginRight: SIZES.xs,
  },
  retryText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
  },
  // Empty state
  emptyCard: {
    padding: SIZES.l,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.m,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: SIZES.m,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.s,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default TodaysTripsScreen;