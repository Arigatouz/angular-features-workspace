/**
 * ANGULAR AI AGENT PROJECT - SERVICE ARCHITECTURE PATTERNS
 *
 * This file demonstrates the key service patterns used throughout this project.
 * Use these patterns as reference when creating new services with Claude Code.
 *
 * Based on analysis of:
 * - projects/ai-agent/src/app/services/google-gen-ai.ts
 * - projects/ai-agent/src/app/services/conversation.service.ts
 * - projects/ai-agent/src/app/services/api-key.service.ts
 */

import { Injectable, signal, computed, inject, effect } from '@angular/core';
import {HttpClient} from '@angular/common/http';

// ===============================================
// PATTERN 1: ROOT-PROVIDED SERVICE ARCHITECTURE
// ===============================================

@Injectable({
  providedIn: 'root'  // ✅ Always use providedIn: 'root' for singleton services
})
export class ExampleService {

  // ===============================================
  // PATTERN 2: SIGNAL-BASED REACTIVE STATE
  // ===============================================

  // ✅ Private mutable signals for internal state
  private readonly _isInitialized = signal(false);
  private readonly _data = signal<any[]>([]);
  private readonly _error = signal<string | null>(null);
  private readonly _loading = signal(false);

  // ✅ Public readonly signals for external consumption
  readonly isInitialized = this._isInitialized.asReadonly();
  readonly data = this._data.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loading = this._loading.asReadonly();

  // ✅ Computed signals for derived state
  readonly isReady = computed(() => this.isInitialized() && !this.loading());
  readonly hasData = computed(() => this.data().length > 0);
  readonly hasError = computed(() => !!this.error());

  // ===============================================
  // PATTERN 3: SERVICE DEPENDENCY INJECTION
  // ===============================================

  // ✅ Inject other services using inject() function
  private readonly dependentService = inject(AnotherService);
  private readonly httpClient = inject(HttpClient); // Example

  // ===============================================
  // PATTERN 4: CONSTRUCTOR INITIALIZATION
  // ===============================================

  constructor() {
    // ✅ Initialize service state in constructor
    this.initializeService();

    // ✅ Set up reactive effects for cross-service communication
    effect(() => {
      if (this.dependentService.isReady()) {
        this.handleDependencyReady();
      }
    });
  }

  // ===============================================
  // PATTERN 5: ASYNC INITIALIZATION PATTERN
  // ===============================================

  private async initializeService(): Promise<void> {
    try {
      // ✅ Load persisted state if applicable
      await this.loadFromStorage();

      // ✅ Set initialization flag
      this._isInitialized.set(true);

      // ✅ Clear any previous errors
      this._error.set(null);
    } catch (error) {
      console.error('Service initialization failed:', error);
      this.setError('Failed to initialize service');
    }
  }

  // ===============================================
  // PATTERN 6: ASYNC OPERATIONS WITH ERROR HANDLING
  // ===============================================

  async performOperation(params: any): Promise<any> {
    // ✅ Check service readiness
    if (!this.isReady()) {
      throw new Error('Service is not ready. Please wait for initialization.');
    }

    try {
      // ✅ Set loading state
      this._loading.set(true);
      this._error.set(null);

      // ✅ Perform the actual operation
      const result = await this.executeOperation(params);

      // ✅ Update state with result
      this.updateState(result);

      return result;

    } catch (error: any) {
      // ✅ Handle different error types
      let errorMessage = 'Operation failed';

      if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = 'Authentication error. Please check your credentials.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.setError(errorMessage);
      throw error;
    } finally {
      // ✅ Always clear loading state
      this._loading.set(false);
    }
  }

  // ===============================================
  // PATTERN 7: STATE MANAGEMENT METHODS
  // ===============================================

  private setError(message: string): void {
    this._error.set(message);
    console.error('Service Error:', message);
  }

  clearError(): void {
    this._error.set(null);
  }

  private updateState(newData: any): void {
    // ✅ Immutable state updates
    const currentData = this._data();
    this._data.set([...currentData, newData]);
  }

  reset(): void {
    this._data.set([]);
    this._error.set(null);
    this._loading.set(false);
  }

  // ===============================================
  // PATTERN 8: STORAGE PATTERNS
  // ===============================================

  private async loadFromStorage(): Promise<void> {
    try {
      // ✅ For sensitive data, use sessionStorage
      const sensitiveData = sessionStorage.getItem('sensitive_key');

      // ✅ For general data, use localStorage
      const generalData = localStorage.getItem('general_key');

      // ✅ For complex data, use IndexedDB (via separate database service)
      // const complexData = await this.databaseService.loadData();

      if (generalData) {
        const parsed = JSON.parse(generalData);
        this._data.set(parsed);
      }
    } catch (error) {
      console.warn('Failed to load from storage:', error);
      // Don't throw - service should still work without stored data
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = this._data();
      localStorage.setItem('general_key', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to storage:', error);
    }
  }

  // ===============================================
  // PATTERN 9: CLEANUP AND LIFECYCLE
  // ===============================================

  destroy(): void {
    // ✅ Clean up any resources
    this.reset();
    // Cancel any pending operations if applicable
  }

  // ===============================================
  // HELPER METHODS
  // ===============================================

  private async executeOperation(params: any): Promise<any> {
    // Simulate async operation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          resolve({ success: true, data: params });
        } else {
          reject(new Error('Simulated operation failure'));
        }
      }, 1000);
    });
  }

  private handleDependencyReady(): void {
    // React to dependency service being ready
    console.log('Dependency service is ready');
  }
}

// ===============================================
// PATTERN 10: API INTEGRATION SERVICE PATTERN
// ===============================================

export interface ApiError {
  message: string;
  type: 'NETWORK_ERROR' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  timestamp: Date;
  code?: number;
}

export interface ApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ApiIntegrationService {
  private currentController?: AbortController;

  readonly isInitialized = signal(false);
  readonly lastError = signal<ApiError | null>(null);
  readonly isLoading = signal(false);

  // ✅ Configuration management
  private apiKey = signal<string | null>(null);
  private baseUrl = signal<string>('');

  constructor() {
    this.initializeApi();
  }

  // ✅ API initialization with configuration
  private initializeApi(): void {
    try {
      // Load configuration
      this.loadConfiguration();
      this.isInitialized.set(true);
      this.clearError();
    } catch (error) {
      console.error('Failed to initialize API:', error);
      this.setError('Failed to initialize API service', 'UNKNOWN_ERROR');
    }
  }

  // ✅ Generic API request method with cancellation support
  async makeRequest<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    if (!this.isInitialized()) {
      throw new Error('API service not initialized');
    }

    // Cancel any existing request
    this.cancelCurrentRequest();

    // Create new abort controller for this request
    this.currentController = new AbortController();
    const abortSignal = this.currentController.signal;

    try {
      this.isLoading.set(true);
      this.lastError.set(null);

      // Check if request was cancelled before starting
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      // Build request configuration
      const config: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
          ...(this.apiKey() && { 'Authorization': `Bearer ${this.apiKey()}` })
        },
        signal: abortSignal,
        ...(request.data && { body: JSON.stringify(request.data) })
      };

      const response = await fetch(`${this.baseUrl()}${request.endpoint}`, config);

      // Check if request was cancelled during fetch
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      if (!response.ok) {
        throw await this.handleHttpError(response);
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        timestamp: new Date()
      };

    } catch (error: any) {
      // Don't log cancellation errors
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        throw new Error('Request was cancelled by user');
      }

      this.handleRequestError(error);
      throw error;
    } finally {
      this.isLoading.set(false);
      this.currentController = undefined;
    }
  }

  // ✅ Request cancellation
  cancelCurrentRequest(): void {
    if (this.currentController && !this.currentController.signal.aborted) {
      this.currentController.abort();
      this.isLoading.set(false);
    }
  }

  // ✅ Configuration management
  setApiKey(apiKey: string): void {
    this.apiKey.set(apiKey);
  }

  setBaseUrl(url: string): void {
    this.baseUrl.set(url);
  }

  // ✅ Error handling
  private async handleHttpError(response: Response): Promise<ApiError> {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    let type: ApiError['type'] = 'UNKNOWN_ERROR';

    try {
      const errorData = await response.json();
      if (errorData.message) {
        message = errorData.message;
      }
    } catch {
      // Use default message if response body is not JSON
    }

    // Map status codes to error types
    switch (response.status) {
      case 401:
      case 403:
        type = 'AUTH_ERROR';
        break;
      case 429:
        type = 'RATE_LIMIT';
        break;
      case 400:
        type = 'VALIDATION_ERROR';
        break;
      default:
        if (response.status >= 500) {
          type = 'NETWORK_ERROR';
        }
    }

    const apiError: ApiError = {
      message,
      type,
      timestamp: new Date(),
      code: response.status
    };

    this.setError(message, type);
    return apiError;
  }

  private handleRequestError(error: any): void {
    let errorType: ApiError['type'] = 'UNKNOWN_ERROR';
    let errorMessage = 'An unexpected error occurred';

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorType = 'NETWORK_ERROR';
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.setError(errorMessage, errorType);
  }

  private setError(message: string, type: ApiError['type']): void {
    this.lastError.set({
      message,
      type,
      timestamp: new Date()
    });
  }

  clearError(): void {
    this.lastError.set(null);
  }

  private loadConfiguration(): void {
    // Load API configuration from environment or storage
    const storedBaseUrl = localStorage.getItem('api_base_url');
    if (storedBaseUrl) {
      this.baseUrl.set(storedBaseUrl);
    }
  }
}

// ===============================================
// PATTERN 11: DATA MANAGEMENT SERVICE PATTERN
// ===============================================

export interface DataEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DataManagementService<T extends DataEntity> {
  private readonly _items = signal<T[]>([]);
  private readonly _activeItemId = signal<string | null>(null);
  private readonly _loading = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly activeItem = computed(() => {
    const id = this._activeItemId();
    return id ? this._items().find(item => item.id === id) || null : null;
  });

  readonly itemCount = computed(() => this._items().length);

  // ✅ CRUD operations with consistent error handling
  async createItem(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      this._loading.set(true);

      const newItem: T = {
        ...data,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as T;

      await this.persistItem(newItem);
      this._items.set([...this._items(), newItem]);

      return newItem.id;
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async updateItem(id: string, updates: Partial<T>): Promise<void> {
    try {
      this._loading.set(true);

      const items = this._items();
      const index = items.findIndex(item => item.id === id);

      if (index === -1) {
        throw new Error('Item not found');
      }

      const updatedItem = {
        ...items[index],
        ...updates,
        updatedAt: new Date()
      };

      await this.persistItem(updatedItem);

      const newItems = [...items];
      newItems[index] = updatedItem;
      this._items.set(newItems);

    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      this._loading.set(true);

      await this.removePersistedItem(id);

      const newItems = this._items().filter(item => item.id !== id);
      this._items.set(newItems);

      if (this._activeItemId() === id) {
        this._activeItemId.set(null);
      }

    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  // ✅ Selection management
  selectItem(id: string): void {
    if (this._items().find(item => item.id === id)) {
      this._activeItemId.set(id);
    }
  }

  clearSelection(): void {
    this._activeItemId.set(null);
  }

  // ✅ Utility methods
  private generateId(): string {
    return crypto.randomUUID();
  }

  private async persistItem(item: T): Promise<void> {
    // Implement persistence logic (localStorage, IndexedDB, API, etc.)
    // This is a template - implement based on your storage needs
  }

  private async removePersistedItem(id: string): Promise<void> {
    // Implement removal logic
  }
}

// ===============================================
// EXAMPLE SERVICE DEPENDENCIES
// ===============================================

@Injectable({
  providedIn: 'root'
})
export class AnotherService {
  readonly isReady = signal(true);
}

/**
 * ===============================================
 * SERVICE PATTERN SUMMARY
 * ===============================================
 *
 * KEY CONVENTIONS TO FOLLOW:
 *
 * 1. ALWAYS use @Injectable({ providedIn: 'root' }) for singleton services
 * 2. ALWAYS use signal-based reactive state management
 * 3. ALWAYS provide readonly signals for external consumption
 * 4. ALWAYS use inject() for service dependencies
 * 5. ALWAYS handle errors with structured error objects
 * 6. ALWAYS provide loading states for async operations
 * 7. ALWAYS use try/catch/finally for async operations
 * 8. ALWAYS clean up resources properly
 * 9. ALWAYS log errors for debugging
 * 10. ALWAYS validate service readiness before operations
 *
 * STATE MANAGEMENT:
 * - Use private mutable signals for internal state
 * - Provide readonly signals for external consumption
 * - Use computed signals for derived state
 * - Update state immutably where possible
 *
 * ERROR HANDLING:
 * - Structured error interfaces with type discrimination
 * - Different error handling strategies by error type
 * - User-friendly error messages
 * - Proper error logging for debugging
 * - Error state cleanup in finally blocks
 *
 * ASYNC OPERATIONS:
 * - Loading state management
 * - Request cancellation support
 * - Proper error propagation
 * - Resource cleanup
 * - Service readiness validation
 *
 * STORAGE PATTERNS:
 * - sessionStorage for sensitive data
 * - localStorage for general application data
 * - IndexedDB for complex/large datasets
 * - Graceful fallback when storage fails
 *
 * LIFECYCLE:
 * - Constructor initialization
 * - Effect-based reactive setup
 * - Proper cleanup methods
 * - Resource management
 */
