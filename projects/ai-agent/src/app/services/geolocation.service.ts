import { Injectable, signal } from '@angular/core';

export interface UserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface GeolocationError {
  message: string;
  code: number;
  timestamp: Date;
}

export type GeolocationStatus = 'idle' | 'requesting' | 'success' | 'error' | 'denied';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  readonly currentPosition = signal<UserPosition | null>(null);
  readonly status = signal<GeolocationStatus>('idle');
  readonly error = signal<GeolocationError | null>(null);
  readonly isSupported = signal<boolean>(false);

  constructor() {
    this.checkGeolocationSupport();
  }

  private checkGeolocationSupport(): void {
    this.isSupported.set('geolocation' in navigator);
  }

  async getCurrentPosition(): Promise<UserPosition> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    this.status.set('requesting');
    this.error.set(null);

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const userPosition: UserPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };

          this.currentPosition.set(userPosition);
          this.status.set('success');
          resolve(userPosition);
        },
        (error: GeolocationPositionError) => {
          const geoError: GeolocationError = {
            message: this.getErrorMessage(error.code),
            code: error.code,
            timestamp: new Date()
          };

          this.error.set(geoError);
          this.status.set(error.code === 1 ? 'denied' : 'error');
          reject(new Error(geoError.message));
        },
        options
      );
    });
  }

  private getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied by user. Please enable location permissions.';
      case 2:
        return 'Location information unavailable. Please try again.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  }

  clearError(): void {
    this.error.set(null);
  }

  resetStatus(): void {
    this.status.set('idle');
    this.error.set(null);
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}