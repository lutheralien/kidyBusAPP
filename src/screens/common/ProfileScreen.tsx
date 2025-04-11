import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button, Input, Card } from "../../components/common";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import { ROUTES } from "../../constants/routes";
import { ParentNavigationProp } from "../../types/navigation.types";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getUserProfile, updateProfile } from "../../store/slices/userSlice";
import { isValidName, isValidEmail, isValidPhone } from "@/src/utils/storage";
import Toast from "react-native-toast-message";

interface ProfileScreenProps {
  navigation: ParentNavigationProp<typeof ROUTES.PROFILE>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, role } = useAuth();
  const dispatch = useAppDispatch();
  const { profile, status } = useAppSelector((state) => state.user);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  // Check if user is a driver
  const isDriver = role === "driver";

  // Load user profile on component mount
  useEffect(() => {
    if (user?._id) {
      dispatch(getUserProfile(user._id));
    }
  }, [dispatch, user]);

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  // Handle form input changes
  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      phone?: string;
    } = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = "Name is required";
    } else if (!isValidName(formData.name)) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation (only for drivers)
    if (isDriver) {
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
    }

    // Phone validation (optional field)
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // If we're exiting edit mode without saving, reset the form
      if (profile) {
        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
        });
      }
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    if (user?._id) {
      try {
        await dispatch(
          updateProfile({
            _id: user._id,
            ...formData,
            role: user.role, // Include the role from your useAuth hook
          })
        ).unwrap();

        setIsEditing(false);
        Toast.show({
          type: "success",
          text1: "Profile Update",
          text2: "Profile updated successfully",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Failed to Update Profile",
          text2: "Failed to update profile. Please try again",
        });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <TouchableOpacity onPress={toggleEditMode}>
            <Text style={styles.editToggleText}>
              {isEditing ? "Cancel" : "Edit Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.profileCard}>
          {/* Profile Picture Placeholder */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            {isEditing && (
              <TouchableOpacity style={styles.changeAvatarButton}>
                <Text style={styles.changeAvatarText}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Information */}
          <View style={styles.profileInfo}>
            {isEditing ? (
              // Edit Mode - Show input fields
              <>
                <Input
                  label="Name"
                  value={formData.name}
                  onChangeText={(value) => handleChange("name", value)}
                  error={errors.name}
                />

                {isDriver && (
                  <Input
                    label="Email"
                    value={formData.email}
                    onChangeText={(value) => handleChange("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email}
                  />
                )}

                <Input
                  label="Phone (optional)"
                  value={formData.phone}
                  onChangeText={(value) => handleChange("phone", value)}
                  keyboardType="phone-pad"
                  error={errors.phone}
                />

                <Button
                  title="Save Changes"
                  onPress={handleSaveProfile}
                  loading={status === "loading"}
                  style={styles.saveButton}
                />
              </>
            ) : (
              // View Mode - Show text
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>
                    {profile?.name || "Not set"}
                  </Text>
                </View>

                {isDriver && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>
                      {profile?.email || "Not set"}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>
                    {profile?.phone || "Not set"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue}>
                    {profile?.role || "User"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Card>

        {/* Account Management Section */}
        <Card style={styles.accountCard}>
          <Text style={styles.sectionTitle}>Account Management</Text>

          <Button
            title="Change Password"
            onPress={() => {}}
            variant="outline"
            style={styles.accountButton}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: SIZES.m,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.m,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h3,
    color: COLORS.text,
  },
  editToggleText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.primary,
  },
  profileCard: {
    marginBottom: SIZES.m,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: SIZES.m,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.s,
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h1,
    color: COLORS.white,
  },
  changeAvatarButton: {
    marginTop: SIZES.xs,
  },
  changeAvatarText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.primary,
  },
  profileInfo: {
    marginTop: SIZES.m,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: SIZES.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.extraLightGray,
  },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    width: "40%",
  },
  infoValue: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.text,
    flex: 1,
  },
  saveButton: {
    marginTop: SIZES.l,
  },
  accountCard: {
    marginBottom: SIZES.m,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.m,
  },
  accountButton: {
    marginBottom: SIZES.s,
  },
});

export default ProfileScreen;
