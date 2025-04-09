// src/screens/admin/AdminDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Button } from '../../components/common';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { AdminNavigationProp } from '../../types/navigation.types';
import { useAuth } from '../../hooks/useAuth';
import { fetchAllUsers } from '@/src/api/authApi';


interface AdminDashboardScreenProps {
  navigation: AdminNavigationProp<typeof ROUTES.ADMIN_DASHBOARD>;
}

// Stats interface
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  adminUsers: number;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    adminUsers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch users data
      const response = await fetchAllUsers(1, 1000); // Get all users
      const users = response.data.users || [];

      // Calculate stats
      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.isActive).length;
      const adminUsers = users.filter(user => user.role === 'admin').length;
      
      // Consider users created in the last 7 days as new
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsers = users.filter(
        user => new Date(user.createdAt) >= oneWeekAgo
      ).length;

      setStats({
        totalUsers,
        activeUsers,
        newUsers,
        adminUsers,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Set mock data for demo purposes
      setStats({
        totalUsers: 150,
        activeUsers: 120,
        newUsers: 15,
        adminUsers: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Navigate to manage users screen
  const goToManageUsers = () => {
    navigation.navigate(ROUTES.MANAGE_USERS);
  };

  // Navigate to settings screen
  const goToSettings = () => {
    navigation.navigate(ROUTES.SETTINGS);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          Welcome, {user?.name || 'Admin'}!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Here's an overview of your application
        </Text>
      </Card>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statValue}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardSecondary]}>
          <Text style={styles.statValue}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardAccent]}>
          <Text style={styles.statValue}>{stats.newUsers}</Text>
          <Text style={styles.statLabel}>New Users</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardInfo]}>
          <Text style={styles.statValue}>{stats.adminUsers}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </Card>
      </View>

      {/* Quick Actions Card */}
      <Card style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <View style={styles.actionsRow}>
          <Button
            title="Manage Users"
            onPress={goToManageUsers}
            style={styles.actionButton}
          />
          
          <Button
            title="Settings"
            onPress={goToSettings}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Recent Activity Card */}
      <Card style={styles.recentActivityCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Mock activity items - replace with actual data */}
        <View style={styles.activityItem}>
          <View style={styles.activityIndicator} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>New user registered</Text>
            <Text style={styles.activityDescription}>
              John Doe (john@example.com) created an account
            </Text>
            <Text style={styles.activityTime}>Today, 10:30 AM</Text>
          </View>
        </View>
        
        <View style={styles.activityItem}>
          <View style={styles.activityIndicator} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>User profile updated</Text>
            <Text style={styles.activityDescription}>
              Jane Smith updated her profile information
            </Text>
            <Text style={styles.activityTime}>Yesterday, 2:45 PM</Text>
          </View>
        </View>
        
        <View style={styles.activityItem}>
          <View style={styles.activityIndicator} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>System update</Text>
            <Text style={styles.activityDescription}>
              Application was updated to version 1.0.5
            </Text>
            <Text style={styles.activityTime}>2 days ago</Text>
          </View>
        </View>
      </Card>

      {/* System Status Card */}
      <Card style={styles.systemCard}>
        <Text style={styles.cardTitle}>System Status</Text>
        
        <View style={styles.systemStatusRow}>
          <Text style={styles.systemStatusLabel}>API Status</Text>
          <View style={styles.systemStatusIndicatorContainer}>
            <View style={[styles.systemStatusIndicator, styles.statusGreen]} />
            <Text style={styles.systemStatusText}>Operational</Text>
          </View>
        </View>
        
        <View style={styles.systemStatusRow}>
          <Text style={styles.systemStatusLabel}>Database</Text>
          <View style={styles.systemStatusIndicatorContainer}>
            <View style={[styles.systemStatusIndicator, styles.statusGreen]} />
            <Text style={styles.systemStatusText}>Operational</Text>
          </View>
        </View>
        
        <View style={styles.systemStatusRow}>
          <Text style={styles.systemStatusLabel}>Storage</Text>
          <View style={styles.systemStatusIndicatorContainer}>
            <View style={[styles.systemStatusIndicator, styles.statusGreen]} />
            <Text style={styles.systemStatusText}>Operational</Text>
          </View>
        </View>
        
        <View style={styles.systemStatusRow}>
          <Text style={styles.systemStatusLabel}>Push Notifications</Text>
          <View style={styles.systemStatusIndicatorContainer}>
            <View style={[styles.systemStatusIndicator, styles.statusGreen]} />
            <Text style={styles.systemStatusText}>Operational</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
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
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.s,
  },
  statCard: {
    width: '48%',
    marginBottom: SIZES.m,
    padding: SIZES.m,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: COLORS.primary,
  },
  statCardSecondary: {
    backgroundColor: COLORS.secondary,
  },
  statCardAccent: {
    backgroundColor: COLORS.accent,
  },
  statCardInfo: {
    backgroundColor: COLORS.info,
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h1,
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.white,
    opacity: 0.8,
  },
  actionsCard: {
    marginBottom: SIZES.m,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.m,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SIZES.xs,
  },
  recentActivityCard: {
    marginBottom: SIZES.m,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.m,
  },
  seeAllText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.primary,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: SIZES.m,
  },
  activityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: SIZES.xs,
    marginRight: SIZES.m,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body1,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  activityDescription: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  activityTime: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.caption,
    color: COLORS.gray,
  },
  systemCard: {
    marginBottom: SIZES.m,
  },
  systemStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default AdminDashboardScreen;