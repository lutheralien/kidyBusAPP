// src/screens/common/SettingsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button } from '../../components/common';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

const SettingsScreen: React.FC = () => {
  const { logout, isAdmin } = useAuth();
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* About Section */}
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingLabel}>About App</Text>
          <Text style={styles.settingDescription}>
            Learn more about this application
          </Text>
        </TouchableOpacity>
      </Card>
      
      {/* Admin Settings (only visible to admin users) */}
      {isAdmin() && (
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Admin Settings</Text>
          
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingLabel}>Application Settings</Text>
            <Text style={styles.settingDescription}>
              Configure global application settings
            </Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingLabel}>User Management</Text>
            <Text style={styles.settingDescription}>
              Manage users and permissions
            </Text>
          </TouchableOpacity>
        </Card>
      )}
      
      {/* App Management */}
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>App Management</Text>
        
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingLabel}>App Version</Text>
          <Text style={styles.settingDescription}>v1.0.0</Text>
        </TouchableOpacity>
      </Card>
      
      {/* Logout Button */}
      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutButton}
      />
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
  settingsCard: {
    marginBottom: SIZES.m,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.m,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.s,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: SIZES.m,
  },
  settingLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body1,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  settingDescription: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.extraLightGray,
    marginVertical: SIZES.s,
  },
  settingButton: {
    paddingVertical: SIZES.s,
  },
  logoutButton: {
    marginTop: SIZES.s,
    marginBottom: SIZES.xl,
  },
});

export default SettingsScreen;