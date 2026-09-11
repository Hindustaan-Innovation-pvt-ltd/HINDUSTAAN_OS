/**
 * Utility to obtain client GPS coordinates from the browser.
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const getBrowserCoordinates = (): Promise<GeoCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(
        new Error('Geolocation is not supported by your browser. Please use a modern browser to check in.')
      );
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = 'Failed to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Location permission denied. Please allow location access in your browser settings to verify attendance within office premises.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              'Location information is unavailable. Please check that GPS/location services are turned on for your device.';
            break;
          case error.TIMEOUT:
            errorMessage =
              'Location request timed out. Please check your network and GPS connection and try again.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
