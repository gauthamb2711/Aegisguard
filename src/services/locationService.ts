import {
  LocationData,
  LocationErrorState,
  PermissionStatusType,
} from '../types/safety';

export const locationService = {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  },

  async checkPermission(): Promise<PermissionStatusType> {
    if (!this.isSupported()) return 'unsupported';
    if (typeof navigator.permissions === 'undefined' || !navigator.permissions.query) {
      return 'unknown';
    }
    try {
      const status = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      return status.state as PermissionStatusType;
    } catch {
      return 'unknown';
    }
  },

  mapGeolocationError(err: GeolocationPositionError | unknown): LocationErrorState {
    if (!this.isSupported()) {
      return {
        code: 'UNSUPPORTED',
        message: 'Geolocation API is not supported by this browser.',
        recovery:
          'Use a modern HTTPS browser (Chrome, Safari, Firefox, Edge). Manual SOS still works without GPS.',
      };
    }

    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as GeolocationPositionError).code === 'number'
    ) {
      const geoErr = err as GeolocationPositionError;
      switch (geoErr.code) {
        case geoErr.PERMISSION_DENIED:
          return {
            code: 'PERMISSION_DENIED',
            message: 'Location permission was denied by the user or browser policy.',
            recovery:
              'Click the site info/lock icon in your browser address bar, allow Location access, then click Retry. You can still send an SOS without GPS.',
          };
        case geoErr.POSITION_UNAVAILABLE:
          return {
            code: 'POSITION_UNAVAILABLE',
            message: 'Device location information is currently unavailable.',
            recovery:
              'Ensure device GPS/Location Services and Wi-Fi are enabled, or move near a window/outdoors and try again.',
          };
        case geoErr.TIMEOUT:
          return {
            code: 'TIMEOUT',
            message: 'Location request timed out before a fix could be obtained.',
            recovery:
              'Try again outdoors or switch off high-accuracy requirement if indoors.',
          };
      }
    }

    return {
      code: 'UNKNOWN',
      message: 'Unable to retrieve location due to an unexpected browser error.',
      recovery: 'Verify HTTPS connection and browser permissions, or proceed with manual SOS.',
    };
  },

  getCurrentPosition(options?: PositionOptions): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(this.mapGeolocationError(null));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          });
        },
        (err) => {
          reject(this.mapGeolocationError(err));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 10000,
          ...options,
        }
      );
    });
  },

  watchPosition(
    onSuccess: (location: LocationData) => void,
    onError: (err: LocationErrorState) => void,
    options?: PositionOptions
  ): number | null {
    if (!this.isSupported()) {
      onError(this.mapGeolocationError(null));
      return null;
    }

    return navigator.geolocation.watchPosition(
      (pos) => {
        onSuccess({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        });
      },
      (err) => {
        onError(this.mapGeolocationError(err));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
        ...options,
      }
    );
  },

  clearWatch(watchId: number | null): void {
    if (watchId !== null && this.isSupported()) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  getGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  },

  getOpenStreetMapUrl(lat: number, lng: number): string {
    return `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lng.toFixed(6)}#map=16/${lat.toFixed(6)}/${lng.toFixed(6)}`;
  },
};
