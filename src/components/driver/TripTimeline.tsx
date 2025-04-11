import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from "react-native";
import { Card } from "../../components/common";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import {
  Feather,
  MaterialIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import moment from "moment";
import { updateStopStatus } from "@/src/api/api.service";
import StudentSelectionModal from "./modal/StudentSelectionModal";
import { useNavigation } from "@react-navigation/native";
import { ROUTES } from "@/src/constants/routes";


// Define TypeScript interfaces
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

interface StopActionModalProps {
  visible: boolean;
  onClose: () => void;
  stop: Stop | null;
  student: Student | null;
  tripId: string;
  onUpdateSuccess: () => void;
}

interface TripTimelineProps {
  trip: Trip;
  onTripAction: (
    tripId: string,
    action: "start" | "complete" | "cancel"
  ) => void;
  onRefresh: () => void;
  showMapButton?: boolean; // Optional prop to control showing the map button
}

// Stop action modal component - updated to include studentId
const StopActionModal = ({
  visible,
  onClose,
  stop,
  student, // New parameter to track which student is being updated
  tripId,
  onUpdateSuccess,
}: StopActionModalProps) => {
  const [loading, setLoading] = useState(false);

  // Get current time in HH:mm format
  const getCurrentTime = () => {
    return moment().format("HH:mm");
  };

  // Handle marking stop as complete
  const handleComplete = async () => {
    if (!stop) return;

    console.log(
      "COMPLETE button pressed for stop:",
      stop.stopId,
      "student:",
      student?._id
    );
    setLoading(true);
    try {
      // Always pass the studentId parameter if available
      await updateStopStatus(
        tripId,
        stop.stopId,
        "completed",
        getCurrentTime(),
        student?._id // Pass specific studentId
      );

      console.log("Server response received successfully for complete action");
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

    console.log(
      "MISSED button pressed for stop:",
      stop.stopId,
      "student:",
      student?._id
    );
    setLoading(true);
    try {
      await updateStopStatus(
        tripId,
        stop.stopId,
        "missed",
        getCurrentTime(),
        student?._id // Pass specific studentId
      );

      console.log("Server response received successfully for missed action");
      onUpdateSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Handle marking stop as cancelled
  const handleCancelled = async () => {
    if (!stop) return;

    console.log(
      "CANCELLED button pressed for stop:",
      stop.stopId,
      "student:",
      student?._id
    );
    setLoading(true);
    try {
      await updateStopStatus(
        tripId,
        stop.stopId,
        "cancelled",
        getCurrentTime(),
        student?._id // Pass specific studentId
      );

      console.log("Server response received successfully for cancelled action");
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
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={styles.modalLoading}
            />
          ) : (
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.completeButton]}
                onPress={handleComplete}
              >
                <Feather
                  name="check-circle"
                  size={18}
                  color={COLORS.white}
                  style={styles.modalButtonIcon}
                />
                <Text style={styles.modalButtonText}>Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.missedButton]}
                onPress={handleMissed}
              >
                <Feather
                  name="x-circle"
                  size={18}
                  color={COLORS.white}
                  style={styles.modalButtonIcon}
                />
                <Text style={styles.modalButtonText}>Missed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelledButton]}
                onPress={handleCancelled}
              >
                <Feather
                  name="slash"
                  size={18}
                  color={COLORS.white}
                  style={styles.modalButtonIcon}
                />
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

// Component to render the timeline for a trip with stops
const TripTimeline = ({
  trip,
  onTripAction,
  onRefresh,
  showMapButton = true, // Default to showing the map button
}: TripTimelineProps) => {
  const navigation = useNavigation();
  
  // Add navigation to map screen with trip ID
  const navigateToTripMap = () => {
    navigation.navigate(ROUTES.DRIVER_MAP, { tripId: trip._id });
  };
  
  // Add null checks to prevent errors
  if (!trip || !trip.stops || !trip.routeId) {
    return (
      <Card style={styles.tripCard}>
        <Text style={styles.errorText}>Error: Invalid trip data</Text>
      </Card>
    );
  }

  const isAfternoon = trip.direction === "afternoon";
  const sortedStops = [...trip.stops].sort((a, b) => a.sequence - b.sequence);

  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  // New state for student selection modal
  const [studentSelectionVisible, setStudentSelectionVisible] = useState(false);
  const [studentsToSelect, setStudentsToSelect] = useState([]);

  // Group stops by parent
  const groupedStops = React.useMemo(() => {
    // Create a map of stopId to array of students with their status
    const stopMap = new Map();

    // First pass: collect all stop info
    sortedStops.forEach((stop) => {
      if (!stop || !stop.stopId) return;

      if (!stopMap.has(stop.stopId)) {
        stopMap.set(stop.stopId, {
          sequence: stop.sequence || 0,
          stopId: stop.stopId,
          plannedTime: stop.plannedTime || "",
          type: stop.type || (stop.studentId ? "pickup" : "school"),
          address: stop.studentId?.parent?.location?.place || "School",
          students: [],
        });
      }

      // Add student to this stop if the stop has a student
      if (stop.studentId) {
        stopMap.get(stop.stopId).students.push({
          ...stop.studentId,
          stopStatus: stop.status || "pending",
          actualTime: stop.actualTime,
          _stopId: stop._id, // Keep the mongo document ID for reference
        });
      }
    });

    // Convert map to array and sort by sequence
    return Array.from(stopMap.values()).sort(
      (a, b) => (a.sequence || 0) - (b.sequence || 0)
    );
  }, [sortedStops]);

  // Group students by parent within each stop
  const organizeStudentsByParent = (students: Student[] = []) => {
    const parentMap = new Map();

    students.forEach((student) => {
      if (!student?.parent?._id) return;

      const parentId = student.parent._id.toString();

      if (!parentMap.has(parentId)) {
        parentMap.set(parentId, {
          parent: student.parent,
          students: [],
        });
      }

      parentMap.get(parentId).students.push(student);
    });

    return Array.from(parentMap.values());
  };

  // Check if all stops are completed or have actionable status
  const allStopsCompleted =
    trip.stops?.every(
      (stop) =>
        stop?.status === "completed" ||
        stop?.status === "missed" ||
        stop?.status === "cancelled"
    ) || false;

  // Check if any stops are completed (trip has started)
  const anyStopsCompleted =
    trip.stops?.some(
      (stop) =>
        stop?.status === "completed" ||
        stop?.status === "missed" ||
        stop?.status === "cancelled"
    ) || false;

  // Get status color
  const getStopStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return COLORS.success;
      case "missed":
        return COLORS.error;
      case "cancelled":
        return COLORS.warning;
      default:
        return COLORS.gray; // pending
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    return moment(time, "HH:mm").format("h:mm A");
  };

  // Get a readable status
  const getReadableStatus = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "pending":
        return "Pending";
      case "missed":
        return "Missed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getTripTitle = () => {
    return `${trip.routeId?.name || "Route"} (${
      isAfternoon ? "Afternoon" : "Morning"
    })`;
  };

  const statusColor = (() => {
    switch (trip.status) {
      case "scheduled":
        return COLORS.primary;
      case "in_progress":
        return COLORS.success;
      case "completed":
        return COLORS.gray;
      case "cancelled":
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  })();

  // Handle opening the stop action modal
  const handleStopPress = (stop) => {
    // Only allow updating stops if trip is in progress
    if (trip.status !== "in_progress") {
      Alert.alert(
        "Info",
        "You can only update stops when trip is in progress."
      );
      return;
    }

    // For school stops or stops without students, update directly
    if (stop.type === "school" || stop.students.length === 0) {
      setSelectedStop(stop);
      setSelectedStudent(null);
      setModalVisible(true);
      return;
    }
    
    console.log('stop.students.length', stop.students.length);
    
    // For stops with multiple students, show student selection modal
    if (stop.students.length > 1) {
      setSelectedStop(stop);
      setStudentsToSelect(stop.students);
      setStudentSelectionVisible(true);
    } else if (stop.students.length === 1) {
      // If only one student, update that student directly
      setSelectedStop(stop);
      setSelectedStudent(stop.students[0]);
      setModalVisible(true);
    }
  };

  // Handle student press for individual updates
  const handleStudentPress = (stop, student) => {
    // Only allow updating if trip is in progress
    if (trip.status !== "in_progress") {
      Alert.alert(
        "Info",
        "You can only update students when trip is in progress."
      );
      return;
    }

    setSelectedStop(stop);
    setSelectedStudent(student);
    setModalVisible(true);
  };

  // Handle selecting a student from the selection modal
  const handleStudentSelection = (stop, student) => {
    console.log('studentstudent',student);
    
    setSelectedStop(stop);
    setSelectedStudent(student);
    setModalVisible(true);
  };

  // Handle stop status update success
  const handleStopUpdateSuccess = () => {
    console.log("Stop update successful, refreshing data");
    onRefresh();
  };

  // Render the status indicator
  const renderStatusIndicator = (status: string) => {
    const color = getStopStatusColor(status);

    switch (status) {
      case "completed":
        return <Feather name="check-circle" size={16} color={color} />;
      case "missed":
        return <Feather name="x-circle" size={16} color={color} />;
      case "cancelled":
        return <Feather name="slash" size={16} color={color} />;
      default:
        return <Feather name="circle" size={16} color={color} />;
    }
  };
  
  // Add visual hint to student cards when trip is in progress
  const renderUpdateHint = (student) => {
    // Only show hints for pending students in in-progress trips
    if (trip.status !== "in_progress" || student.stopStatus !== "pending") {
      return null;
    }
    
    return (
      <View style={styles.updateHintContainer}>
        <Feather name="edit-2" size={12} color={COLORS.primary} />
        <Text style={styles.updateHintText}>Tap to update</Text>
      </View>
    );
  };

  return (
    <>
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
          tripId={trip._id}
          onUpdateSuccess={handleStopUpdateSuccess}
        />
      )}

      <Card style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <View style={styles.tripHeaderLeft}>
            <MaterialIcons
              name={isAfternoon ? "wb-twilight" : "wb-sunny"}
              size={20}
              color={isAfternoon ? "#8B5CF6" : "#F59E0B"}
            />
            <Text style={styles.tripTitle}>{getTripTitle()}</Text>
          </View>
          <View
            style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}
          >
            <Feather
              name={
                trip.status === "scheduled"
                  ? "clock"
                  : trip.status === "in_progress"
                  ? "navigation"
                  : trip.status === "completed"
                  ? "check-circle"
                  : "x-circle"
              }
              size={12}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getReadableStatus(trip.status)}
            </Text>
          </View>
        </View>

        <View style={styles.timelineContainer}>
          {groupedStops.map((stop, stopIndex) => {
            const isFirst = stopIndex === 0;
            const isLast = stopIndex === groupedStops.length - 1;
            const isSchool = stop.type === "school";

            // For school stops or stops without parents
            if (isSchool || stop.students.length === 0) {
              return (
                <View key={`stop-${stop.stopId}`}>
                  {/* Connector line before stop (except first) */}
                  {!isFirst && <View style={styles.connectorLine} />}

                  {/* School stop */}
                  <TouchableOpacity
                    style={styles.stopContainer}
                    onPress={() => handleStopPress(stop)}
                    activeOpacity={trip.status === "in_progress" ? 0.7 : 1}
                  >
                    <View style={styles.stopIconContainer}>
                      <View style={styles.stopCircle}>
                        <Ionicons
                          name="school"
                          size={16}
                          color={COLORS.primary}
                        />
                      </View>
                    </View>
                    <View style={styles.stopContent}>
                      <Text style={styles.stopTitle}>
                        School Stop {isFirst ? "(Departure)" : "(Arrival)"}
                      </Text>
                      <Text style={styles.stopTime}>
                        {formatTime(stop.plannedTime)}
                      </Text>
                      <View
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor: isFirst
                              ? `${COLORS.primary}15`
                              : `${COLORS.success}15`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: isFirst ? COLORS.primary : COLORS.success,
                            },
                          ]}
                        >
                          {isFirst ? "Start" : "End"} Point
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Connector line after stop (except last) */}
                  {!isLast && <View style={styles.connectorLine} />}
                </View>
              );
            }

            // For regular stops with students
            const parentGroups = organizeStudentsByParent(stop.students);

            return (
              <View key={`stop-${stop.stopId}`}>
                {/* Connector line before stop (except first) */}
                {!isFirst && <View style={styles.connectorLine} />}

                {/* Stop location header */}
                <TouchableOpacity
                  style={styles.stopContainer}
                  onPress={() => handleStopPress(stop)}
                  activeOpacity={trip.status === "in_progress" ? 0.7 : 1}
                >
                  <View style={styles.stopIconContainer}>
                    <View style={styles.stopCircle}>
                      <Ionicons
                        name={isAfternoon ? "exit" : "enter"}
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>
                  </View>
                  <View style={styles.stopContent}>
                    <Text style={styles.stopTitle}>
                      Stop #{stop.sequence}: {stop.address || "Location"}
                    </Text>
                    <Text style={styles.stopTime}>
                      {formatTime(stop.plannedTime)}
                    </Text>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: `${COLORS.primary}15` },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: COLORS.primary }]}
                      >
                        {isAfternoon ? "Drop-off" : "Pick-up"} Location
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Parent groups at this stop */}
                <View style={styles.parentsContainer}>
                  {parentGroups.map((parentGroup, parentIndex) => (
                    <View
                      key={`parent-${parentGroup.parent._id}`}
                      style={styles.parentCard}
                    >
                      {/* Parent info */}
                      <View style={styles.parentHeader}>
                        <View style={styles.parentInfo}>
                          <Ionicons
                            name="person"
                            size={16}
                            color={COLORS.textSecondary}
                          />
                          <Text style={styles.parentName}>
                            {parentGroup.parent.name}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.phoneButton}
                          onPress={() => {
                            // Handle phone call
                            Alert.alert(
                              "Contact Parent",
                              `Call ${parentGroup.parent.name} at ${parentGroup.parent.phone}?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                { text: "Call", onPress: () => {} },
                              ]
                            );
                          }}
                        >
                          <Ionicons
                            name="call"
                            size={16}
                            color={COLORS.primary}
                          />
                          <Text style={styles.phoneText}>
                            {parentGroup.parent.phone}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Students for this parent */}
                      <View style={styles.studentsContainer}>
                        {parentGroup.students.map((student: Student) => {
                          const statusColor = getStopStatusColor(
                            student.stopStatus
                          );

                          return (
                            <TouchableOpacity
                              key={`student-${student._id}`}
                              style={[
                                styles.studentCard,
                                trip.status === "in_progress" && student.stopStatus === "pending" 
                                  ? styles.updatableStudentCard : {}
                              ]}
                              onPress={() => handleStudentPress(stop, student)}
                              activeOpacity={
                                trip.status === "in_progress" ? 0.7 : 1
                              }
                            >
                              <View style={styles.studentInfo}>
                                <View style={styles.studentAvatar}>
                                  <Ionicons
                                    name="school-outline"
                                    size={20}
                                    color={COLORS.primary}
                                  />
                                </View>
                                <View style={styles.studentDetails}>
                                  <Text style={styles.studentName}>
                                    {student.name}
                                  </Text>
                                  <Text style={styles.studentClass}>
                                    {student.class}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.studentStatus}>
                                {renderStatusIndicator(student.stopStatus)}
                                <Text
                                  style={[
                                    styles.statusText,
                                    { color: statusColor, marginLeft: 4 },
                                  ]}
                                >
                                  {getReadableStatus(student.stopStatus)}
                                </Text>

                                {student.actualTime && (
                                  <Text style={styles.actualTime}>
                                    {formatTime(student.actualTime)}
                                  </Text>
                                )}
                              </View>
                              
                              {/* Render update hint for pending students */}
                              {renderUpdateHint(student)}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Connector line after stop (except last) */}
                {!isLast && <View style={styles.connectorLine} />}
              </View>
            );
          })}
        </View>

        {/* Action buttons based on trip status */}
        {trip.status === "scheduled" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => onTripAction(trip._id, "start")}
          >
            <Feather
              name="play"
              size={16}
              color={COLORS.white}
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>Start Trip</Text>
          </TouchableOpacity>
        )}

        {trip.status === "in_progress" && (
          <View style={styles.actionButtonsContainer}>
            {allStopsCompleted && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => onTripAction(trip._id, "complete")}
              >
                <Feather
                  name="check-circle"
                  size={16}
                  color={COLORS.white}
                  style={styles.actionButtonIcon}
                />
                <Text style={styles.actionButtonText}>Complete Trip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.cancelButton,
                allStopsCompleted ? { marginTop: SIZES.s } : {},
              ]}
              onPress={() => onTripAction(trip._id, "cancel")}
            >
              <Feather
                name="x-circle"
                size={16}
                color={COLORS.white}
                style={styles.actionButtonIcon}
              />
              <Text style={styles.actionButtonText}>Cancel Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed info */}
        {trip.status === "completed" && (
          <View style={styles.completedInfo}>
            <Feather name="check-circle" size={16} color={COLORS.success} />
            <Text style={styles.completedText}>Trip completed</Text>
          </View>
        )}

        {/* Cancelled info */}
        {trip.status === "cancelled" && (
          <View style={styles.cancelledInfo}>
            <Feather name="x-circle" size={16} color={COLORS.error} />
            <Text style={styles.cancelledText}>Trip cancelled</Text>
          </View>
        )}

        {/* Map Button - Show if enabled */}
        {showMapButton && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={navigateToTripMap}
          >
            <Feather
              name="map-pin"
              size={16}
              color={COLORS.white}
              style={styles.mapButtonIcon}
            />
            <Text style={styles.mapButtonText}>View Route on Map</Text>
          </TouchableOpacity>
        )}
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  // Trip card styles
  tripCard: {
    marginBottom: SIZES.m,
    padding: SIZES.m,
    borderRadius: SIZES.borderRadius,
    elevation: 3,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.caption,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.m,
  },
  tripHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.s,
    paddingVertical: SIZES.xs / 2,
    borderRadius: SIZES.borderRadius,
  },
  statusText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body4,
    marginLeft: 4,
  },

  // Timeline styles
  timelineContainer: {
    marginVertical: SIZES.s,
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray,
    marginLeft: 24, // Align with the center of the stop icon
  },
  stopContainer: {
    flexDirection: "row",
    marginVertical: SIZES.xs,
    paddingVertical: SIZES.s,
    borderRadius: SIZES.borderRadius,
  },
  stopIconContainer: {
    alignItems: "center",
    width: 50,
  },
  stopCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  stopContent: {
    flex: 1,
  },
  stopTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
  },
  stopTime: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body4,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Parent and student styles
  parentsContainer: {
    marginLeft: 50, // Align with stop content
    marginBottom: SIZES.s,
  },
  parentCard: {
    backgroundColor: `${COLORS.gray}10`,
    borderRadius: SIZES.borderRadius,
    marginVertical: SIZES.xs,
    overflow: "hidden",
  },
  parentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SIZES.s,
    backgroundColor: `${COLORS.gray}15`,
  },
  parentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  parentName: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}10`,
    paddingVertical: SIZES.xs / 2,
    paddingHorizontal: SIZES.s,
    borderRadius: SIZES.borderRadius,
  },
  phoneText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body4,
    color: COLORS.primary,
    marginLeft: 4,
  },
  studentsContainer: {
    padding: SIZES.xs,
  },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SIZES.s,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    marginVertical: SIZES.xs / 2,
    elevation: 1,
    position: "relative", // For update hint positioning
  },
  updatableStudentCard: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  studentDetails: {
    marginLeft: SIZES.xs,
  },
  studentName: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.text,
  },
  studentClass: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body4,
    color: COLORS.textSecondary,
  },
  studentStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.gray}10`,
    paddingVertical: SIZES.xs / 2,
    paddingHorizontal: SIZES.s,
    borderRadius: SIZES.borderRadius,
  },
  actualTime: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body4,
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  updateHintContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  updateHintText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body4,
    color: COLORS.primary,
    marginLeft: 2,
  },

  // Map button styles
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: SIZES.s,
    borderRadius: SIZES.borderRadius,
    marginTop: SIZES.m,
  },
  mapButtonIcon: {
    marginRight: SIZES.xs,
  },
  mapButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
  },

  // Action button styles
  actionButtonsContainer: {
    marginTop: SIZES.m,
  },
  actionButton: {
    marginTop: SIZES.m,
    paddingVertical: SIZES.s,
    paddingHorizontal: SIZES.m,
    borderRadius: SIZES.borderRadius,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonIcon: {
    marginRight: SIZES.xs,
  },
  actionButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.white,
  },
  completedInfo: {
    marginTop: SIZES.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  completedText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.success,
    marginLeft: SIZES.xs,
  },
  cancelledInfo: {
    marginTop: SIZES.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelledText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body3,
    color: COLORS.error,
    marginLeft: SIZES.xs,
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

  // Status styles
  missedButton: {
    backgroundColor: COLORS.error,
  },
  cancelledButton: {
    backgroundColor: COLORS.warning,
  },
});

export default TripTimeline;