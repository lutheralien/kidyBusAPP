import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  Linking,
  Animated,
  Image,
  Platform
} from 'react-native';
import { Card } from '@/src/components/common';
import { COLORS, FONTS, SIZES } from '@/src/constants/theme';
import { Feather, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import moment from 'moment';
import { Trip, IStop } from './tripUtils';

interface StudentWithStatus {
  student: any;
  status: string;
  actualTime?: string;
}

const JourneyTimeline = ({ trip }: { trip: Trip }) => {
  const [expanded, setExpanded] = useState(false);
  
  const isAfternoon = trip.direction === 'afternoon';
  const isTripActive = trip.status === 'in_progress';
  const isTripCompleted = trip.status === 'completed';
  const isTripCancelled = trip.status === 'cancelled';
  
  // Sort stops by sequence
  const sortedStops = [...trip.stops].sort((a, b) => a.sequence - b.sequence);
  
  // Get status color
  const getStatusColor = (status: string | string[]) => {
    const statusToCheck = Array.isArray(status) ? status[0] : status;
    
    switch(statusToCheck) {
      case 'completed': return COLORS.success; // Green success color
      case 'missed': return COLORS.error; // Red error color
      case 'cancelled': return COLORS.warning; // Orange warning color
      case 'in_progress': return COLORS.info; // Blue info color
      default: return COLORS.gray; // Grey for pending
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return moment(time, 'HH:mm').format('h:mm A');
  };
  
  const getReadableStatus = (status: string | string[]) => {
    const statusToCheck = Array.isArray(status) ? status[0] : status;
    
    switch(statusToCheck) {
      case 'completed': return 'Completed';
      case 'missed': return 'Missed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'scheduled': return 'Scheduled';
      default: return 'Pending';
    }
  };
  
  // Get status for a specific student in a multi-student stop
  const getStudentStatus = (stop: IStop, studentIndex: number) => {
    if (!Array.isArray(stop.status)) return stop.status;
    return stop.status[studentIndex] || 'pending';
  };

  const getStudentReadableStatus = (stop: IStop, studentIndex: number) => {
    const status = getStudentStatus(stop, studentIndex);
    return getReadableStatus(status);
  };

  const getTripTitle = () => {
    return `${isAfternoon ? 'Afternoon' : 'Morning'} Journey`;
  };
  
  const getRouteNameAndCount = () => {
    const studentCount = sortedStops.reduce((count, stop) => {
      if (stop.students && stop.students.length > 0) {
        return count + stop.students.length;
      } else if (stop.studentId) {
        return count + 1;
      }
      return count;
    }, 0);
    
    return {
      routeName: trip.routeId?.name || 'Route',
      studentCount
    };
  };

  const handleContactDriver = () => {
    if (trip.driverId && trip.driverId.phone) {
      Linking.openURL(`tel:${trip.driverId.phone}`);
    }
  };
  
  // Get trip status color
  const getTripStatusColor = () => {
    switch(trip.status) {
      case 'completed': return COLORS.success;
      case 'cancelled': return COLORS.error;
      case 'in_progress': return COLORS.info;
      case 'scheduled': return COLORS.primary;
      default: return COLORS.gray;
    }
  };
  
  // Get trip status badge background color (lighter version)
  const getTripStatusBgColor = () => {
    const color = getTripStatusColor();
    return `${color}15`; // 15% opacity version
  };
  
  // Get trip icon name based on status
  const getTripStatusIcon = () => {
    switch(trip.status) {
      case 'completed': return 'check-circle';
      case 'cancelled': return 'x-circle';
      case 'in_progress': return 'navigation';
      case 'scheduled': return 'clock';
      default: return 'help-circle';
    }
  };
  
  // Get stop icon based on type and status
  const getStopIcon = (stop: IStop) => {
    const isSchool = stop.type === 'school';
    
    if (isSchool) {
      return { name: 'school', component: Ionicons };
    }
    
    const status = Array.isArray(stop.status) ? stop.status[0] : stop.status;
    
    if (status === 'completed') {
      return { name: 'check-circle', component: Feather };
    } else if (status === 'missed') {
      return { name: 'x-circle', component: Feather };
    } else if (status === 'cancelled') {
      return { name: 'alert-circle', component: Feather };
    } else if (status === 'in_progress') {
      return { name: 'navigation', component: Feather };
    } else {
      return isAfternoon ? 
        { name: 'exit', component: Ionicons } : 
        { name: 'enter', component: Ionicons };
    }
  };
  
  // Function to get all students with their statuses from a stop
  const getStudentsWithStatus = (stop: IStop): StudentWithStatus[] => {
    const result: StudentWithStatus[] = [];
    
    if (stop.students && stop.students.length > 0) {
      stop.students.forEach((student, index) => {
        const status = getStudentStatus(stop, index);
        result.push({
          student,
          status,
          actualTime: stop.actualTime
        });
      });
    } else if (stop.studentId) {
      result.push({
        student: stop.studentId,
        status: Array.isArray(stop.status) ? stop.status[0] : stop.status,
        actualTime: stop.actualTime
      });
    }
    
    return result;
  };

  const { routeName, studentCount } = getRouteNameAndCount();

  return (
    <Card style={[
      styles.card,
      isAfternoon ? styles.afternoonCard : styles.morningCard
    ]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.journeyIconContainer,
            isAfternoon ? styles.afternoonIcon : styles.morningIcon
          ]}>
            <MaterialIcons 
              name={isAfternoon ? 'wb-twilight' : 'wb-sunny'} 
              size={20} 
              color={COLORS.white}
            />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{getTripTitle()}</Text>
            <Text style={styles.headerSubtitle}>{routeName} • {studentCount} {studentCount === 1 ? 'student' : 'students'}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getTripStatusBgColor() }
        ]}>
          <Feather name={getTripStatusIcon()} size={14} color={getTripStatusColor()} />
          <Text style={[styles.statusText, { color: getTripStatusColor() }]}>
            {getReadableStatus(trip.status)}
          </Text>
        </View>
      </View>
      
      {/* Journey Summary */}
      <View style={styles.journeySummary}>
        <View style={styles.journeyInfoRow}>
          <View style={styles.journeyInfo}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{moment(trip.date).format('ddd, MMM D')}</Text>
          </View>
          <View style={styles.journeyInfo}>
            <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Driver:</Text>
            <Text style={styles.infoValue}>{trip.driverId.name}</Text>
          </View>
        </View>
        
        {isTripCompleted && (
          <View style={styles.completedContainer}>
            <Feather name="check-circle" size={16} color={COLORS.success} />
            <Text style={styles.completedText}>Journey completed</Text>
          </View>
        )}
        
        {isTripCancelled && (
          <View style={styles.cancelledContainer}>
            <Feather name="x-circle" size={16} color={COLORS.error} />
            <Text style={styles.cancelledText}>Journey cancelled</Text>
          </View>
        )}
      </View>
      
      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {sortedStops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === sortedStops.length - 1;
          const stopIcon = getStopIcon(stop);
          const IconComponent = stopIcon.component;
          const isSchool = stop.type === 'school';
          const status = Array.isArray(stop.status) ? stop.status[0] : stop.status;
          const statusColor = getStatusColor(status);
          const isCompleted = status === 'completed';
          const isMissed = status === 'missed';
          const isCancelled = status === 'cancelled';
          const isActive = status === 'in_progress';
          const isSchoolStop = stop.type === 'school';
          
          const studentsWithStatus = getStudentsWithStatus(stop);
          
          return (
            <View key={stop.stopId || index} style={styles.timelineStop}>
              {/* Connector Line - Only show if not first stop */}
              {!isFirst && (
                <View 
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: sortedStops[index - 1].status === 'completed' ? 
                        COLORS.success : 
                        COLORS.gray
                    }
                  ]} 
                />
              )}
              
              {/* Stop Circle */}
              <View 
                style={[
                  styles.stopCircle,
                  isCompleted ? styles.completedStopCircle : 
                  isMissed ? styles.missedStopCircle :
                  isCancelled ? styles.cancelledStopCircle :
                  isActive ? styles.activeStopCircle :
                  isSchoolStop ? styles.schoolStopCircle : {}
                ]}
              >
                <IconComponent 
                  name={stopIcon.name}
                  size={isCompleted || isMissed || isCancelled ? 12 : 14}
                  color={isCompleted ? COLORS.success : 
                         isMissed ? COLORS.error :
                         isCancelled ? COLORS.warning :
                         isActive ? COLORS.info :
                         isSchoolStop ? COLORS.primary : COLORS.text}
                />
              </View>
              
              {/* Connector Line - Only show if not last stop */}
              {!isLast && (
                <View 
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: status === 'completed' ? 
                        COLORS.success : 
                        COLORS.gray
                    }
                  ]} 
                />
              )}
              
              {/* Stop Details */}
              <View style={styles.stopDetails}>
                {/* Stop Type/Location */}
                <View style={styles.stopHeader}>
                  <Text style={styles.stopType}>
                    {isSchool ? 
                      (isAfternoon ? 'School Departure' : 'School Arrival') : 
                      (isAfternoon ? 'Drop-off Stop' : 'Pick-up Stop')}
                  </Text>
                  <View style={styles.timeContainer}>
                    <Text style={styles.plannedTime}>
                      {formatTime(stop.plannedTime)}
                    </Text>
                    {stop.actualTime && (isCompleted || isMissed || isCancelled) && (
                      <Text style={styles.actualTime}>
                        (Actual: {formatTime(stop.actualTime)})
                      </Text>
                    )}
                  </View>
                </View>
                
                {/* Students at this stop */}
                {studentsWithStatus.length > 0 && !isSchool && (
                  <View style={styles.studentsContainer}>
                    {studentsWithStatus.map((item, studentIndex) => (
                      <View key={item.student._id} style={styles.studentRow}>
                        <View style={styles.studentInfo}>
                          <View style={styles.studentAvatar}>
                            <Text style={styles.studentInitials}>
                              {item.student.name.charAt(0)}
                            </Text>
                          </View>
                          <Text style={styles.studentName}>{item.student.name}</Text>
                        </View>
                        <View 
                          style={[
                            styles.studentStatusBadge,
                            { backgroundColor: `${getStatusColor(item.status)}15` }
                          ]}
                        >
                          <Feather 
                            name={
                              item.status === 'completed' ? 'check' :
                              item.status === 'missed' ? 'x' :
                              item.status === 'cancelled' ? 'slash' :
                              item.status === 'in_progress' ? 'navigation' : 'clock'
                            } 
                            size={12} 
                            color={getStatusColor(item.status)} 
                          />
                          <Text 
                            style={[
                              styles.studentStatusText,
                              { color: getStatusColor(item.status) }
                            ]}
                          >
                            {getReadableStatus(item.status)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Address for pickup/dropoff stops */}
                {!isSchool && (
                  <Text style={styles.stopAddress}>
                    {stop.address || 'Address not available'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
      
      {/* Contact Driver Button */}
      <TouchableOpacity 
        style={styles.contactButton}
        onPress={handleContactDriver}
      >
        <View style={styles.contactButtonContent}>
          <View style={styles.contactIconContainer}>
            <Feather name="phone" size={18} color={COLORS.white} />
          </View>
          <Text style={styles.contactText}>Contact Driver</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  morningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Amber color for morning
  },
  afternoonCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6', // Purple color for afternoon
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  journeyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morningIcon: {
    backgroundColor: '#F59E0B', // Amber color for morning
  },
  afternoonIcon: {
    backgroundColor: '#8B5CF6', // Purple color for afternoon
  },
  headerTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginLeft: 4,
  },
  journeySummary: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.01)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  journeyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  journeyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 4,
  },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  infoValue: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.success}10`,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 8,
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.error}10`,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelledText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 8,
  },
  timelineContainer: {
    padding: 16,
  },
  timelineStop: {
    flexDirection: 'row',
  },
  connectorLine: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.gray,
    marginLeft: 16,
  },
  stopCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  completedStopCircle: {
    borderColor: COLORS.success,
    backgroundColor: 'white',
  },
  missedStopCircle: {
    borderColor: COLORS.error,
    backgroundColor: 'white',
  },
  cancelledStopCircle: {
    borderColor: COLORS.warning,
    backgroundColor: 'white',
  },
  activeStopCircle: {
    borderColor: COLORS.info,
    backgroundColor: `${COLORS.info}15`,
  },
  schoolStopCircle: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  stopDetails: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 16,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopType: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  plannedTime: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text,
  },
  actualTime: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  studentsContainer: {
    backgroundColor: 'rgba(0,0,0,0.01)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  studentInitials: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.white,
  },
  studentName: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text,
  },
  studentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentStatusText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginLeft: 4,
  },
  stopAddress: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  contactButton: {
    marginVertical: 16,
    marginHorizontal: 16,
  },
  contactButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  contactText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.white,
  },
});

export default JourneyTimeline;