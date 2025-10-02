import { Component, inject, signal, computed, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { GoogleMap, MapInfoWindow, MapMarker, GoogleMapsModule } from '@angular/google-maps';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GeolocationService, UserPosition } from '../../services/geolocation.service';
import { PointOfInterestService, POICategory, PointOfInterest as POI } from '../../services/point-of-interest.service';
import { MapsApiKeyService } from '../../services/maps-api-key.service';
import { MapsApiKeyModalComponent } from '../maps-api-key-modal/maps-api-key-modal.component';

@Component({
  selector: 'app-point-of-interest',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GoogleMapsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDialogModule
  ],
  templateUrl: './point-of-interest.html',
  styleUrl: './point-of-interest.scss'
})
export class PointOfInterest implements OnInit {
  @ViewChild(GoogleMap) map!: GoogleMap;
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  private readonly geolocationService = inject(GeolocationService);
  readonly poiService = inject(PointOfInterestService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly mapsApiKeyService = inject(MapsApiKeyService);

  readonly form = this.fb.group({
    selectedCategories: this.fb.control<POICategory[]>([])
  });

  // Google Maps API state
  readonly googleMapsApiKey = this.mapsApiKeyService.apiKey;
  readonly hasApiKey = this.mapsApiKeyService.hasApiKey;
  readonly isMapLoaded = signal(false);

  // Map configuration
  readonly mapOptions: google.maps.MapOptions = {
    zoom: 13,
    center: { lat: 40.7589, lng: -73.9851 }, // Default: NYC
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true
  };

  readonly mapCenter = signal<google.maps.LatLngLiteral>({ lat: 40.7589, lng: -73.9851 });
  readonly mapZoom = signal(13);
  readonly selectedPOI = signal<POI | null>(null);
  readonly infoWindowPosition = signal<google.maps.LatLngLiteral | null>(null);

  readonly isLocationLoading = computed(() =>
    this.geolocationService.status() === 'requesting'
  );

  readonly isPOISearching = computed(() =>
    this.poiService.isSearching()
  );

  readonly currentPosition = this.geolocationService.currentPosition;
  readonly locationStatus = this.geolocationService.status;
  readonly locationError = this.geolocationService.error;
  readonly isGeolocationSupported = this.geolocationService.isSupported;

  readonly categories = this.poiService.categories;
  readonly searchResults = this.poiService.filteredResults;
  readonly hasResults = computed(() => this.searchResults().length > 0);

  readonly selectedCategoriesCount = computed(() =>
    this.form.get('selectedCategories')?.value?.length || 0
  );

  ngOnInit(): void {
    // Subscribe to form changes to update the service
    this.form.get('selectedCategories')?.valueChanges.subscribe(categories => {
      this.poiService.setSelectedCategories(categories || []);
    });

    // Check if API key exists, otherwise prompt for it
    if (this.hasApiKey()) {
      this.loadGoogleMapsAPI();
    }
  }

  openApiKeyModal(): void {
    const dialogRef = this.dialog.open(MapsApiKeyModalComponent, {
      width: '550px',
      disableClose: false,
      panelClass: 'api-key-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.valid && result?.apiKey) {
        this.mapsApiKeyService.saveApiKey(result.apiKey);
        this.loadGoogleMapsAPI();
        this.showSuccess('Google Maps API key saved successfully!');
      }
    });
  }

  clearApiKey(): void {
    this.mapsApiKeyService.clearApiKey();
    this.isMapLoaded.set(false);
    this.showSuccess('Google Maps API key cleared');
  }

  private loadGoogleMapsAPI(): void {
    const apiKey = this.googleMapsApiKey();
    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      return;
    }

    // Check if Google Maps API is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      this.isMapLoaded.set(true);
      return;
    }

    // Dynamically load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.isMapLoaded.set(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      this.showError('Failed to load Google Maps. Please check your API key.');
      this.mapsApiKeyService.clearApiKey();
    };
    document.head.appendChild(script);
  }

  async getCurrentLocation(): Promise<void> {
    if (!this.isGeolocationSupported()) {
      this.showError('Geolocation is not supported by your browser');
      return;
    }

    try {
      const position = await this.geolocationService.getCurrentPosition();
      this.showSuccess(`Location acquired: ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`);

      // Update map center to user's location
      this.mapCenter.set({ lat: position.latitude, lng: position.longitude });
      this.mapZoom.set(13);

      // Automatically search for POIs after getting location
      await this.searchNearbyPOIs();
    } catch (error: any) {
      this.showError(error.message || 'Failed to get your location');
    }
  }

  async searchNearbyPOIs(): Promise<void> {
    const position = this.currentPosition();
    if (!position) {
      this.showError('Please get your current location first');
      return;
    }

    try {
      const results = await this.poiService.searchNearbyPOIs(position);
      this.showSuccess(`Found ${results.length} nearby points of interest`);
    } catch (error: any) {
      this.showError('Failed to search for nearby points of interest');
      console.error('POI search error:', error);
    }
  }

  onCategoryChange(category: POICategory, isSelected: boolean): void {
    const currentCategories = this.form.get('selectedCategories')?.value || [];

    if (isSelected) {
      const newCategories = [...currentCategories, category];
      this.form.get('selectedCategories')?.setValue(newCategories);
    } else {
      const newCategories = currentCategories.filter(c => c !== category);
      this.form.get('selectedCategories')?.setValue(newCategories);
    }
  }

  isCategorySelected(category: POICategory): boolean {
    const selectedCategories = this.form.get('selectedCategories')?.value || [];
    return selectedCategories.includes(category);
  }

  clearSelection(): void {
    this.form.get('selectedCategories')?.setValue([]);
    this.poiService.clearResults();
  }

  selectAllCategories(): void {
    const allCategories = this.categories.map(cat => cat.id);
    this.form.get('selectedCategories')?.setValue(allCategories);
  }

  getLocationStatusText(): string {
    const status = this.locationStatus();
    const error = this.locationError();

    switch (status) {
      case 'idle':
        return 'Ready to get location';
      case 'requesting':
        return 'Getting your location...';
      case 'success':
        const pos = this.currentPosition();
        return pos ? `Location: ${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}` : 'Location acquired';
      case 'denied':
        return 'Location access denied';
      case 'error':
        return error?.message || 'Location error';
      default:
        return 'Unknown status';
    }
  }

  getLocationStatusIcon(): string {
    const status = this.locationStatus();

    switch (status) {
      case 'idle':
        return 'location_off';
      case 'requesting':
        return 'gps_not_fixed';
      case 'success':
        return 'location_on';
      case 'denied':
        return 'location_disabled';
      case 'error':
        return 'gps_off';
      default:
        return 'help_outline';
    }
  }

  formatDistance(distance?: number): string {
    if (!distance) return 'N/A';

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }

  // Map interaction methods
  onMarkerClick(poi: POI, marker: MapMarker): void {
    this.selectedPOI.set(poi);
    this.infoWindowPosition.set({ lat: poi.latitude, lng: poi.longitude });
    this.infoWindow.open(marker);
  }

  onPOIListItemClick(poi: POI): void {
    this.selectedPOI.set(poi);
    this.mapCenter.set({ lat: poi.latitude, lng: poi.longitude });
    this.mapZoom.set(15);

    // Scroll to map if on mobile
    if (window.innerWidth < 768) {
      const mapElement = document.querySelector('.map-container');
      mapElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getUserLocationMarkerOptions(): google.maps.MarkerOptions {
    return {
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      },
      title: 'Your Location'
    };
  }

  getPOIMarkerOptions(poi: POI): google.maps.MarkerOptions {
    const icon = this.poiService.getCategoryInfo(poi.category)?.icon || 'place';
    return {
      title: poi.name,
      animation: google.maps.Animation.DROP
    };
  }

  getGoogleMapsDirectionsUrl(poi: POI): string {
    const position = this.currentPosition();
    if (position) {
      return `https://www.google.com/maps/dir/?api=1&origin=${position.latitude},${position.longitude}&destination=${poi.latitude},${poi.longitude}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`;
  }

  openGoogleMaps(poi: POI): void {
    window.open(this.getGoogleMapsDirectionsUrl(poi), '_blank', 'noopener,noreferrer');
  }

  getApiKeyInstructionsUrl(): string {
    return 'https://developers.google.com/maps/documentation/javascript/get-api-key';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
