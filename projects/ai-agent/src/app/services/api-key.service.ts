import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiKeyService {
  private readonly API_KEY_STORAGE_KEY = 'google_ai_api_key';

  // Signal to track API key state
  private readonly _apiKey = signal<string | null>(null);
  private readonly _isValidated = signal(false);

  // Public readonly signals
  readonly apiKey = this._apiKey.asReadonly();
  readonly isValidated = this._isValidated.asReadonly();
  readonly hasApiKey = signal(false);

  constructor() {
    // Try to load API key from sessionStorage on service initialization
    this.loadApiKeyFromStorage();
  }

  /**
   * Set and validate the API key
   */
  setApiKey(apiKey: string, isValidated: boolean = false) {
    this._apiKey.set(apiKey);
    this._isValidated.set(isValidated);
    this.hasApiKey.set(!!apiKey);

    if (isValidated && apiKey) {
      // Store in sessionStorage (not localStorage for security)
      sessionStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    }
  }

  /**
   * Clear the API key
   */
  clearApiKey() {
    this._apiKey.set(null);
    this._isValidated.set(false);
    this.hasApiKey.set(false);
    sessionStorage.removeItem(this.API_KEY_STORAGE_KEY);
  }

  /**
   * Get the current API key (for service usage)
   */
  getCurrentApiKey(): string | null {
    return this._apiKey();
  }

  /**
   * Check if we have a valid API key
   */
  isReady(): boolean {
    return this.hasApiKey() && this._isValidated();
  }

  /**
   * Load API key from sessionStorage
   */
  private loadApiKeyFromStorage() {
    try {
      const storedApiKey = sessionStorage.getItem(this.API_KEY_STORAGE_KEY);
      if (storedApiKey) {
        // Set the key but mark as needing validation
        // (we'll validate it when the service first tries to use it)
        this._apiKey.set(storedApiKey);
        this.hasApiKey.set(true);
        // Don't set as validated - let the service validate it on first use
      }
    } catch (error) {
      console.warn('Failed to load API key from storage:', error);
    }
  }

  /**
   * Mark the current API key as validated
   */
  markAsValidated() {
    if (this._apiKey()) {
      this._isValidated.set(true);
    }
  }

  /**
   * Mark the current API key as invalid
   */
  markAsInvalid() {
    this._isValidated.set(false);
  }

  /**
   * Get API key info for debugging (masked)
   */
  getApiKeyInfo(): { exists: boolean; masked: string; validated: boolean } {
    const key = this._apiKey();
    return {
      exists: !!key,
      masked: key ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : 'None',
      validated: this._isValidated()
    };
  }
}