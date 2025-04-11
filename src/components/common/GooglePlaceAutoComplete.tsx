import {View, Text, StyleSheet, Platform} from 'react-native';
import React from 'react';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import { useSelector } from 'react-redux';
import { ConfigState } from '@/src/store/slices/configSlice';
import { SIZES, COLORS, FONTS, SHADOWS, ELEVATIONS } from '@/src/constants/theme';
import { RootState } from '@/src/store/store';
;

type MapProps = {
  handleFinish: (value: any) => void;
};

const GooglePlaceAutoComplete = ({handleFinish}: MapProps) => {
    const mapsKey = useSelector((state: RootState) => state.config.mapsKey);

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder="Search for a location in Ghana"
        styles={{
          container: styles.autocompleteContainer,
          textInput: styles.textInput,
          description: styles.description,
          predefinedPlacesDescription: styles.predefinedPlacesDescription,
          row: styles.row,
          separator: styles.separator,
          poweredContainer: styles.poweredContainer,
        }}
        onPress={(data, details = null) => {
          console.log('data',data);
          
          handleFinish(data?.description);
        }}
        query={{
          key: `${mapsKey}`,
          language: 'en',
          components: 'country:gh',
          location: '5.6037,-0.1870', // Accra coordinates
          radius: '50000', // 50km radius
          strictbounds: true,
          types: 'geocode|establishment', // Include both addresses and establishments
        }}
        enablePoweredByContainer={false}
        fetchDetails={true}
        debounce={300}
        timeout={15000}
        minLength={2}
        nearbyPlacesAPI="GooglePlacesSearch"
        GooglePlacesDetailsQuery={{
          fields: 'geometry,formatted_address',
        }}
        filterReverseGeocodingByTypes={[
          'locality',
          'administrative_area_level_1',
          'postal_code',
          'sublocality',
          'street_address',
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: SIZES.s + 2,
  },
  autocompleteContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  textInput: {
    height: SIZES.inputHeight,
    color: COLORS.text,
    fontSize: FONTS.body1,
    fontFamily: FONTS.regular,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.m,
    paddingVertical: SIZES.s + 4,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: SIZES.s,
    ...Platform.select({
      ios: SHADOWS.small,
      android: ELEVATIONS.small,
    }),
  },
  description: {
    color: COLORS.text,
    fontSize: FONTS.body2,
    fontFamily: FONTS.regular,
  },
  predefinedPlacesDescription: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  row: {
    padding: SIZES.s + 5,
    minHeight: SIZES.inputHeight - 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  poweredContainer: {
    display: 'none', // Hide the "Powered by Google" container
  },
});

export default GooglePlaceAutoComplete;
