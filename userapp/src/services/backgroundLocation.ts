import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import Geolocation from '@react-native-community/geolocation';
import { updateOrderLocation } from './api';

const INTERVAL_MS = 15000;

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

const taskOptions = {
  taskName: 'VendorLiveLocationTask',
  taskTitle: 'Live tracking active',
  taskDesc: 'Updating your location while app is in background',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#f28b2c',
  parameters: {
    delay: INTERVAL_MS,
  },
  // Android changes the service type automatically when using location access.
  // The manifest already includes the required foreground service declaration.
};

const requestAndroidLocationPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const finePermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'App needs location permission to share your location in the background.',
      buttonPositive: 'OK',
      buttonNegative: 'Cancel',
    }
  );

  console.log('[BackgroundLocation] ACCESS_FINE_LOCATION permission:', finePermission);
  if (finePermission !== PermissionsAndroid.RESULTS.GRANTED) {
    console.warn('[BackgroundLocation] Fine location permission denied');
    return false;
  }

  const backgroundPermission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    {
      title: 'Background Location Permission',
      message: 'App needs background location permission to keep sharing your location even when the app is closed or in the background.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    }
  );
  console.log('[BackgroundLocation] ACCESS_BACKGROUND_LOCATION permission:', backgroundPermission);

  if (backgroundPermission !== PermissionsAndroid.RESULTS.GRANTED) {
    console.warn('[BackgroundLocation] Background location permission denied');

    // Show alert explaining why background location is needed
    Alert.alert(
      'Background Location Required',
      'Background location permission is required for live tracking when the app is closed. Please enable it in app settings.',
      [
        {
          text: 'Go to Settings',
          onPress: () => {
            Linking.openSettings();
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );

    return false;
  }

  return true;
};

const getCurrentPositionAsync = (options: any) => new Promise<any>((resolve, reject) => {
  Geolocation.getCurrentPosition(
    (pos) => resolve(pos.coords),
    (err) => reject(err),
    options
  );
});

const getCurrentLocation = async (): Promise<any | null> => {
  console.log('[BackgroundLocation] attempting to get current location...');
  try {
    console.log('[BackgroundLocation] trying high accuracy location...');
    const position = await getCurrentPositionAsync({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 15000,
    });
    console.log('[BackgroundLocation] high accuracy success:', position);
    return position;
  } catch (error: any) {
    console.warn('[BackgroundLocation] high accuracy location failed, retrying with lower accuracy:', error);
    try {
      console.log('[BackgroundLocation] trying low accuracy location...');
      const fallbackPosition = await getCurrentPositionAsync({
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 30000,
      });
      console.log('[BackgroundLocation] low accuracy success:', fallbackPosition);
      return fallbackPosition;
    } catch (fallbackError) {
      console.warn('[BackgroundLocation] low accuracy location failed:', fallbackError);
      return null;
    }
  }
};

const backgroundLocationTask = async (taskData?: { bookingId: string; delay: number }) => {
  if (!taskData) {
    console.error('[BackgroundLocation] no task data available to start task');
    return;
  }

  const { bookingId, delay } = taskData;
  console.log('[BackgroundLocation] task initialized', { bookingId, delay });

  let cycleCount = 0;
  while (BackgroundService.isRunning()) {
    cycleCount++;
    console.log(`[BackgroundLocation] starting cycle ${cycleCount} for booking ${bookingId}`);

    try {
      const position = await getCurrentLocation();
      if (position && position.latitude != null && position.longitude != null) {
        console.log(`[BackgroundLocation] cycle ${cycleCount} - got position:`, {
          latitude: position.latitude,
          longitude: position.longitude,
          timestamp: new Date().toISOString(),
        });
        const result = await updateOrderLocation(bookingId, position.latitude, position.longitude);
        console.log(`[BackgroundLocation] cycle ${cycleCount} - location update response:`, result);
      } else {
        console.warn(`[BackgroundLocation] cycle ${cycleCount} - no location available this cycle`, position);
      }
    } catch (error) {
      console.error(`[BackgroundLocation] cycle ${cycleCount} - update failed:`, error);
    }

    console.log(`[BackgroundLocation] cycle ${cycleCount} completed, sleeping for ${delay}ms`);
    await sleep(delay);
  }

  console.log('[BackgroundLocation] task loop exited, service no longer running');
};

export const startVendorBackgroundLocation = async (bookingId: string) => {
  try {
    console.log('[BackgroundLocation] requesting start for bookingId:', bookingId);
    if (BackgroundService.isRunning()) {
      console.log('[BackgroundLocation] service already running');
      return true;
    }

    const granted = await requestAndroidLocationPermissions();
    if (!granted) {
      console.warn('[BackgroundLocation] location permission denied - cannot start background tracking');

      // Try to check if we can at least do foreground location
      const canDoForeground = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (canDoForeground) {
        console.log('[BackgroundLocation] foreground location available, but background denied');
        // Could implement foreground-only tracking here if needed
      }

      return false;
    }

    await BackgroundService.start(backgroundLocationTask, {
      ...taskOptions,
      parameters: {
        bookingId,
        delay: INTERVAL_MS,
      },
    });

    console.log('[BackgroundLocation] background service started, checking if running:', BackgroundService.isRunning());
    return true;
  } catch (error) {
    console.error('[BackgroundLocation] start failed:', error);
    return false;
  }
};

export const stopVendorBackgroundLocation = async () => {
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
  } catch (error) {
    console.warn('[BackgroundLocation] stop failed:', error);
  }
};

export const testLocationOnce = async () => {
  console.log('[BackgroundLocation] testing location once...');
  try {
    const position = await getCurrentLocation();
    if (position && position.latitude != null && position.longitude != null) {
      console.log('[BackgroundLocation] test location success:', {
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: new Date().toISOString(),
      });
      return position;
    } else {
      console.warn('[BackgroundLocation] test location failed - no position:', position);
      return null;
    }
  } catch (error) {
    console.error('[BackgroundLocation] test location error:', error);
    return null;
  }
};
