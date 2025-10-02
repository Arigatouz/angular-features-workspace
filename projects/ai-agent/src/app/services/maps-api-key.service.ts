import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapsApiKeyService {
  private readonly STORAGE_KEY = 'google_maps_api_key';
  readonly apiKey = signal<string | null>(null);
  readonly hasApiKey = signal<boolean>(false);

  constructor() {
    this.loadApiKey();
  }

  private loadApiKey(): void {
    try {
      const storedKey = localStorage.getItem(this.STORAGE_KEY);
      if (storedKey) {
        this.apiKey.set(storedKey);
        this.hasApiKey.set(true);
      }
    } catch (error) {
      console.error('Failed to load Maps API key from storage:', error);
    }
  }

  saveApiKey(apiKey: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, apiKey);
      this.apiKey.set(apiKey);
      this.hasApiKey.set(true);
    } catch (error) {
      console.error('Failed to save Maps API key to storage:', error);
      throw new Error('Failed to save API key');
    }
  }

  clearApiKey(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.apiKey.set(null);
      this.hasApiKey.set(false);
    } catch (error) {
      console.error('Failed to clear Maps API key from storage:', error);
    }
  }

  getApiKey(): string | null {
    return this.apiKey();
  }
}
