import { Injectable, inject, signal, computed } from '@angular/core';
import { GeolocationService, UserPosition } from './geolocation.service';

export interface PointOfInterest {
  id: string;
  name: string;
  category: POICategory;
  latitude: number;
  longitude: number;
  address: string;
  description?: string;
  rating?: number;
  distance?: number;
}

export type POICategory =
  | 'restaurant'
  | 'gas_station'
  | 'pharmacy'
  | 'hospital'
  | 'bank'
  | 'shopping'
  | 'entertainment'
  | 'education'
  | 'transport'
  | 'tourism';

export interface POICategoryInfo {
  id: POICategory;
  label: string;
  icon: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class PointOfInterestService {
  private readonly geolocationService = inject(GeolocationService);

  readonly selectedCategories = signal<POICategory[]>([]);
  readonly searchResults = signal<PointOfInterest[]>([]);
  readonly isSearching = signal(false);

  readonly categories: POICategoryInfo[] = [
    { id: 'restaurant', label: 'Restaurants', icon: 'restaurant', description: 'Dining and food establishments' },
    { id: 'gas_station', label: 'Gas Stations', icon: 'local_gas_station', description: 'Fuel stations and car services' },
    { id: 'pharmacy', label: 'Pharmacies', icon: 'local_pharmacy', description: 'Pharmacies and medical supplies' },
    { id: 'hospital', label: 'Hospitals', icon: 'local_hospital', description: 'Medical facilities and clinics' },
    { id: 'bank', label: 'Banks & ATMs', icon: 'account_balance', description: 'Banking and financial services' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping_cart', description: 'Retail stores and malls' },
    { id: 'entertainment', label: 'Entertainment', icon: 'movie', description: 'Cinemas, theaters, and entertainment' },
    { id: 'education', label: 'Education', icon: 'school', description: 'Schools, universities, and libraries' },
    { id: 'transport', label: 'Transportation', icon: 'directions_transit', description: 'Bus stops, train stations, airports' },
    { id: 'tourism', label: 'Tourism', icon: 'place', description: 'Tourist attractions and landmarks' }
  ];

  // Mock POI data - in a real application, this would come from an API
  private readonly mockPOIs: PointOfInterest[] = [
    // Restaurants
    { id: '1', name: 'Downtown Bistro', category: 'restaurant', latitude: 40.7589, longitude: -73.9851, address: '123 Main St, New York, NY', rating: 4.5 },
    { id: '2', name: 'Pizza Corner', category: 'restaurant', latitude: 40.7614, longitude: -73.9776, address: '456 Broadway, New York, NY', rating: 4.2 },
    { id: '3', name: 'Sushi Palace', category: 'restaurant', latitude: 40.7505, longitude: -73.9934, address: '789 5th Ave, New York, NY', rating: 4.8 },

    // Gas Stations
    { id: '4', name: 'Shell Station', category: 'gas_station', latitude: 40.7580, longitude: -73.9855, address: '321 Park Ave, New York, NY' },
    { id: '5', name: 'BP Fuel', category: 'gas_station', latitude: 40.7648, longitude: -73.9808, address: '654 Madison Ave, New York, NY' },

    // Pharmacies
    { id: '6', name: 'CVS Pharmacy', category: 'pharmacy', latitude: 40.7590, longitude: -73.9820, address: '987 Lexington Ave, New York, NY' },
    { id: '7', name: 'Walgreens', category: 'pharmacy', latitude: 40.7560, longitude: -73.9865, address: '147 E 42nd St, New York, NY' },

    // Hospitals
    { id: '8', name: 'City Medical Center', category: 'hospital', latitude: 40.7570, longitude: -73.9840, address: '258 E 68th St, New York, NY', rating: 4.3 },
    { id: '9', name: 'Emergency Clinic', category: 'hospital', latitude: 40.7620, longitude: -73.9790, address: '369 W 57th St, New York, NY', rating: 4.1 },

    // Banks
    { id: '10', name: 'Chase Bank', category: 'bank', latitude: 40.7600, longitude: -73.9800, address: '741 3rd Ave, New York, NY' },
    { id: '11', name: 'Bank of America', category: 'bank', latitude: 40.7550, longitude: -73.9900, address: '852 6th Ave, New York, NY' },

    // Shopping
    { id: '12', name: 'Times Square Mall', category: 'shopping', latitude: 40.7580, longitude: -73.9855, address: '1540 Broadway, New York, NY', rating: 4.0 },
    { id: '13', name: 'Central Market', category: 'shopping', latitude: 40.7614, longitude: -73.9776, address: '963 8th Ave, New York, NY', rating: 4.4 },

    // Entertainment
    { id: '14', name: 'AMC Theater', category: 'entertainment', latitude: 40.7589, longitude: -73.9851, address: '234 W 42nd St, New York, NY', rating: 4.2 },
    { id: '15', name: 'Comedy Club', category: 'entertainment', latitude: 40.7505, longitude: -73.9934, address: '567 Greenwich St, New York, NY', rating: 4.6 },

    // Education
    { id: '16', name: 'Public Library', category: 'education', latitude: 40.7614, longitude: -73.9776, address: '476 5th Ave, New York, NY', rating: 4.7 },
    { id: '17', name: 'Community College', category: 'education', latitude: 40.7648, longitude: -73.9808, address: '789 Amsterdam Ave, New York, NY', rating: 4.1 },

    // Transportation
    { id: '18', name: 'Grand Central', category: 'transport', latitude: 40.7527, longitude: -73.9772, address: '89 E 42nd St, New York, NY' },
    { id: '19', name: 'Port Authority', category: 'transport', latitude: 40.7589, longitude: -73.9899, address: '625 8th Ave, New York, NY' },

    // Tourism
    { id: '20', name: 'Central Park', category: 'tourism', latitude: 40.7829, longitude: -73.9654, address: 'Central Park, New York, NY', rating: 4.9 },
    { id: '21', name: 'Empire State Building', category: 'tourism', latitude: 40.7484, longitude: -73.9857, address: '350 5th Ave, New York, NY', rating: 4.8 }
  ];

  readonly filteredResults = computed(() => {
    const selected = this.selectedCategories();
    const results = this.searchResults();

    if (selected.length === 0) {
      return results;
    }

    return results.filter(poi => selected.includes(poi.category));
  });

  setSelectedCategories(categories: POICategory[]): void {
    this.selectedCategories.set(categories);
  }

  async searchNearbyPOIs(userPosition: UserPosition): Promise<PointOfInterest[]> {
    this.isSearching.set(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculate distances and sort by proximity
      const poisWithDistance = this.mockPOIs.map(poi => ({
        ...poi,
        distance: this.geolocationService.calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          poi.latitude,
          poi.longitude
        )
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

      // Limit to nearest 20 POIs
      const nearbyPOIs = poisWithDistance.slice(0, 20);

      this.searchResults.set(nearbyPOIs);
      return nearbyPOIs;

    } catch (error) {
      console.error('Error searching POIs:', error);
      throw error;
    } finally {
      this.isSearching.set(false);
    }
  }

  getCategoryInfo(category: POICategory): POICategoryInfo | undefined {
    return this.categories.find(cat => cat.id === category);
  }

  clearResults(): void {
    this.searchResults.set([]);
    this.selectedCategories.set([]);
  }
}