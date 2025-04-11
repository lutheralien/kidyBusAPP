import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import Geocoder from 'react-native-geocoding';
import GooglePlaceAutoComplete from './GooglePlaceAutoComplete';
import { ILocation } from '@/src/custom';
import { SIZES, COLORS, FONTS, SHADOWS, ELEVATIONS } from '@/src/constants/theme';
import { setUserLocation } from '../../store/slices/configSlice';

interface LocationDropdownProps {
  isVisible: boolean;
  onClose: () => void;
  currentAddress?: string;
  currentLocation?: ILocation | null;
  onSelectLocation: (Ilocation: Location) => void;
}

const { width, height } = Dimensions.get('window');

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  isVisible,
  onClose,
  currentAddress,
  currentLocation,
  onSelectLocation,
}) => {
  // Redux dispatch hook
  const dispatch = useDispatch();
  
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 5.6037,  // Default to Accra
    longitude: -0.1870,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isLoading, setIsLoading] = useState(false);
  const isDarkMode = useSelector((state: any) => state.isDarkMode);

  useEffect(() => {
    if (isVisible && currentLocation) {
      const latitude = Array.isArray(currentLocation.coordinates) 
        ? currentLocation.coordinates[1] 
        : parseFloat(currentLocation.coordinates.latitude);
      const longitude = Array.isArray(currentLocation.coordinates)
        ? currentLocation.coordinates[0]
        : parseFloat(currentLocation.coordinates.longitude);

      setMapRegion({
        ...mapRegion,
        latitude,
        longitude,
      });
      setSelectedLocation(currentLocation);
    }
  }, [isVisible, currentLocation]);

  const handleSelectLocation = useCallback((description, details = null) => {
    setIsLoading(true);
    
    // If we have details with geometry, use it directly
    if (details && details.geometry) {
      const { lat, lng } = details.geometry.location;
      const newLocation = {
        coordinates: [lng, lat] as [number, number],
        place: description,
      };
      
      setSelectedLocation(newLocation);
      setMapRegion({
        ...mapRegion,
        latitude: lat,
        longitude: lng,
      });
      setIsLoading(false);
      return;
    }
    
    // Otherwise use Geocoder to get coordinates from description
    Geocoder.from(description)
      .then(json => {
        if (json.results.length > 0) {
          const { lat, lng } = json.results[0].geometry.location;
          const newLocation = {
            coordinates: [lng, lat] as [number, number],
            place: description,
          };
          console.log('newLocation', newLocation);
          
          setSelectedLocation(newLocation);
          setMapRegion({
            ...mapRegion,
            latitude: lat,
            longitude: lng,
          });
        }
      })
      .catch(error => console.log('Geocoding error:', error))
      .finally(() => setIsLoading(false));
  }, [mapRegion]);

  const handleMapPress = useCallback(event => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
    setIsLoading(true);
    
    setSelectedLocation({
      coordinates: [longitude, latitude] as [number, number],
      place: 'Loading address...',
    });

    Geocoder.from(latitude, longitude)
      .then(json => {
        if (json.status === 'OK') {
          const addressComponent = json.results[0].formatted_address;
          setSelectedLocation({
            coordinates: [longitude, latitude] as [number, number],
            place: addressComponent,
          });
        }
      })
      .catch(error => {
        console.log('Reverse geocoding error:', error);
        setSelectedLocation(prevState => ({
          ...prevState!,
          place: 'Selected Location',
        }));
      })
      .finally(() => setIsLoading(false));
  }, [mapRegion]);

  const handleClose = useCallback(() => {
    setSelectedLocation(null);
    setIsMapModalVisible(false);
    onClose();
  }, [onClose]);

  // Modified to directly dispatch the setUserLocation action
  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      // Extract the coordinates
      const [longitude, latitude] = selectedLocation.coordinates;

      // Dispatch the action to update location in Redux state
      dispatch(setUserLocation({
        type: 'Point',
        coordinates: [longitude, latitude],
        place: selectedLocation.place
      }));
      
      // Also call onSelectLocation for backward compatibility
      onSelectLocation(selectedLocation);
    }
    handleClose();
  }, [selectedLocation, dispatch, onSelectLocation, handleClose]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleClose}
              style={styles.closeButton}>
              <Ionicons name="close" size={SIZES.iconSize} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Location</Text>
            <View style={styles.headerRight} />
          </View>
          
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <FlatList
              data={[{ key: 'autocomplete' }]}
              renderItem={() => (
                <View style={styles.searchContainer}>
                  <GooglePlaceAutoComplete handleFinish={handleSelectLocation} />
                </View>
              )}
              keyExtractor={item => item.key}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={() => (
                <View style={styles.headerComponentContainer}>
                  {isLoading && (
                    <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
                  )}
                  <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={() => setIsMapModalVisible(true)}>
                    <Ionicons name="map-outline" size={20} color={COLORS.white} />
                    <Text style={styles.mapButtonText}>Select on Map</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListFooterComponent={() =>
                selectedLocation && (
                  <View style={styles.footerContainer}>
                    <Text style={styles.selectedLocationText}>
                      Selected: {selectedLocation.place}
                    </Text>
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={handleConfirm}>
                      <Ionicons name="checkmark" size={20} color={COLORS.white} />
                      <Text style={styles.confirmButtonText}>Confirm Location</Text>
                    </TouchableOpacity>
                  </View>
                )
              }
            />
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isMapModalVisible}
        onRequestClose={() => setIsMapModalVisible(false)}>
        <SafeAreaView style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}>
            <Marker coordinate={mapRegion} />
          </MapView>
          
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={styles.mapBackButton}
              onPress={() => setIsMapModalVisible(false)}>
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
              <Text style={styles.mapBackButtonText}>Back to Search</Text>
            </TouchableOpacity>
            
            {selectedLocation && (
              <TouchableOpacity
                style={styles.mapConfirmButton}
                onPress={() => {
                  setIsMapModalVisible(false);
                  handleConfirm();
                }}>
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                <Text style={styles.mapConfirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.semiTransparent,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    borderTopLeftRadius: SIZES.borderRadius * 2.5,
    borderTopRightRadius: SIZES.borderRadius * 2.5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.extraLightGray,
  },
  headerTitle: {
    fontSize: FONTS.h3,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  closeButton: {
    padding: SIZES.s,
  },
  headerRight: {
    width: SIZES.xl + SIZES.s,
  },
  keyboardView: {
    flex: 1,
  },
  searchContainer: {
    padding: SIZES.m,
  },
  headerComponentContainer: {
    padding: SIZES.m,
  },
  loader: {
    marginVertical: SIZES.l,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SIZES.m,
    borderRadius: SIZES.borderRadius,
    marginTop: SIZES.s,
    ...Platform.select({
      ios: SHADOWS.small,
      android: ELEVATIONS.small,
    }),
  },
  mapButtonText: {
    color: COLORS.white,
    marginLeft: SIZES.s,
    fontSize: FONTS.button,
    fontFamily: FONTS.medium,
  },
  footerContainer: {
    padding: SIZES.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.extraLightGray,
  },
  selectedLocationText: {
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.m,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SIZES.m,
    borderRadius: SIZES.borderRadius,
    ...Platform.select({
      ios: SHADOWS.small,
      android: ELEVATIONS.small,
    }),
  },
  confirmButtonText: {
    color: COLORS.white,
    marginLeft: SIZES.s,
    fontSize: FONTS.button,
    fontFamily: FONTS.medium,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    padding: SIZES.m,
  },
  mapBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    padding: SIZES.m - 4,
    borderRadius: SIZES.borderRadius,
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: SHADOWS.medium,
      android: ELEVATIONS.medium,
    }),
  },
  mapBackButtonText: {
    color: COLORS.white,
    marginLeft: SIZES.s,
    fontSize: FONTS.button,
    fontFamily: FONTS.medium,
  },
  mapConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SIZES.m,
    borderRadius: SIZES.borderRadius,
    position: 'absolute',
    bottom: -height + 180,
    left: SIZES.m,
    right: SIZES.m,
    ...Platform.select({
      ios: SHADOWS.medium,
      android: ELEVATIONS.medium,
    }),
  },
  mapConfirmButtonText: {
    color: COLORS.white,
    marginLeft: SIZES.s,
    fontSize: FONTS.button,
    fontFamily: FONTS.medium,
  },
});

export default LocationDropdown;