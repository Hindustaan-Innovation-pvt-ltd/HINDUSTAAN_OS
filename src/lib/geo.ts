/**
 * Utility to obtain client GPS coordinates from the browser and resolve city names.
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

interface KnownCity {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

const KNOWN_CITIES: KnownCity[] = [
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Bhilai', state: 'Chhattisgarh', lat: 21.2120, lng: 81.3733 },
  { name: 'Durg', state: 'Chhattisgarh', lat: 21.1904, lng: 81.2849 },
  { name: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0797, lng: 82.1409 },
  { name: 'Korba', state: 'Chhattisgarh', lat: 22.3595, lng: 82.7501 },
  { name: 'Rajnandgaon', state: 'Chhattisgarh', lat: 21.0974, lng: 81.0388 },
  { name: 'Jagdalpur', state: 'Chhattisgarh', lat: 19.0734, lng: 82.0229 },
  { name: 'Delhi', state: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Chandigarh', state: 'Punjab / Haryana', lat: 30.7333, lng: 76.7794 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns city and state name based on latitude and longitude coordinates.
 */
export function getCityFromCoordinates(
  latitude?: number | null,
  longitude?: number | null
): string {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return 'Location Denied';
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return 'Location Denied';
  }

  let closestCity: KnownCity = KNOWN_CITIES[0];
  let minDistance = Infinity;

  for (const city of KNOWN_CITIES) {
    const dist = calculateDistance(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = city;
    }
  }

  if (minDistance <= 70) {
    return `${closestCity.name}, ${closestCity.state}`;
  } else if (minDistance <= 150) {
    return `Near ${closestCity.name}, ${closestCity.state}`;
  }

  return `${closestCity.name} Region, India`;
}

