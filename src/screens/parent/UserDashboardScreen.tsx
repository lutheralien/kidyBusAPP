// src/screens/user/UserDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Button } from '../../components/common';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { UserNavigationProp } from '../../types/navigation.types';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getUserProfile } from '../../store/slices/userSlice';

interface UserDashboardScreenProps {
  navigation: UserNavigationProp<typeof ROUTES.USER_DASHBOARD>;
}

const UserDashboardScreen: React.FC<UserDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const data = useAppSelector(state => state.user);
  
  const { profile, status } = useAppSelector(state => state.user);
  
  const [refreshing, setRefreshing] = useState(false);

  // Load user profile on component mount
  useEffect(() => {
    if (user?._id) {
      dispatch(getUserProfile(user._id));
    }
  }, [dispatch, user]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    if (user?._id) {
      setRefreshing(true);
      await dispatch(getUserProfile(user._id));
      setRefreshing(false);
    }
  };

  // Navigate to profile screen
  const goToProfile = () => {
    navigation.navigate(ROUTES.PROFILE);
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
          Welcome back, {user?.name || 'User'}!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Here's what's happening with your account
        </Text>
      </Card>

      {/* User Info Card */}
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>Your Profile</Text>
          <TouchableOpacity onPress={goToProfile}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{profile?.name || user?.name || 'Not set'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{profile?.email || user?.email || 'Not set'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role:</Text>
          <Text style={styles.infoValue}>{profile?.role || user?.role || 'User'}</Text>
        </View>

        <Button
          title="View Full Profile"
          onPress={goToProfile}
          variant="outline"
          style={styles.profileButton}
        />
      </Card>

      {/* Quick Actions Card */}
      <Card style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        
        <View style={styles.actionsRow}>
          <Button
            title="Settings"
            onPress={goToSettings}
            style={styles.actionButton}
          />
          
          <Button
            title="Help & Support"
            onPress={() => {}}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* App Stats or Recent Activity - Customize for your app */}
      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>App Statistics</Text>
        
        {/* Replace with your app's actual statistics */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Notifications</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Activities</Text>
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
  infoCard: {
    marginBottom: SIZES.m,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.m,
  },
  infoTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
  },
  editText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SIZES.s,
  },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    width: '30%',
  },
  infoValue: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.text,
    flex: 1,
  },
  profileButton: {
    marginTop: SIZES.m,
  },
  actionsCard: {
    marginBottom: SIZES.m,
  },
  actionsTitle: {
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
  statsCard: {
    marginBottom: SIZES.m,
  },
  statsTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.m,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.extraLightGray,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.m,
    marginBottom: SIZES.m,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h2,
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
  },
});

export default UserDashboardScreen;
