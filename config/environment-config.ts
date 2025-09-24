/**
 * ANGULAR AI AGENT PROJECT - ENVIRONMENT CONFIGURATION PATTERNS
 *
 * This file demonstrates the environment configuration patterns used in this project.
 * Use these patterns as reference when creating environment files with Claude Code.
 *
 * Based on analysis of:
 * - projects/ai-agent/src/environments/environment.ts
 * - projects/ai-agent/src/environments/environment.development.ts
 * - projects/ai-agent/src/environments/environment.prod.ts
 */

// ===============================================
// PATTERN 1: BASE ENVIRONMENT INTERFACE
// ===============================================

/**
 * ✅ Define a strict interface for environment configuration
 * This ensures type safety and consistency across all environments
 */
export interface Environment {
  production: boolean;
  GOOGLE_API_KEY: string;

  // Additional configuration options that could be added:
  apiBaseUrl?: string;
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  maxRetries?: number;
  timeout?: number;
  features?: {
    [key: string]: boolean;
  };
  buildInfo?: {
    version: string;
    buildDate: string;
    gitCommit?: string;
  };
}

// ===============================================
// PATTERN 2: BASE ENVIRONMENT (environment.ts)
// ===============================================

/**
 * ✅ Base environment file - used as default and replaced during builds
 * This file is replaced by specific environment files during build process
 */
export const environment: Environment = {
  production: false,
  GOOGLE_API_KEY: '', // ✅ Empty by default - users provide via modal

  // ✅ Default values for optional properties
  apiBaseUrl: 'https://api.example.com',
  enableLogging: true,
  enableAnalytics: false,
  maxRetries: 3,
  timeout: 30000, // 30 seconds

  // ✅ Feature flags for conditional functionality
  features: {
    experimentalFeatures: false,
    debugMode: true,
    offlineMode: false
  },

  buildInfo: {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    gitCommit: 'development'
  }
};

// ===============================================
// PATTERN 3: DEVELOPMENT ENVIRONMENT
// ===============================================

/**
 * ✅ Development-specific configuration
 * Used during: ng serve, ng build --configuration development
 */
export const developmentEnvironment: Environment = {
  production: false,
  GOOGLE_API_KEY: '', // ✅ Still empty - provided by user

  // ✅ Development-friendly settings
  apiBaseUrl: 'http://localhost:3000/api',
  enableLogging: true,          // ✅ Verbose logging in dev
  enableAnalytics: false,       // ✅ No analytics in dev
  maxRetries: 1,                // ✅ Fewer retries for faster feedback
  timeout: 60000,               // ✅ Longer timeout for debugging

  features: {
    experimentalFeatures: true,  // ✅ Enable experimental features in dev
    debugMode: true,
    offlineMode: true           // ✅ Allow offline testing
  },

  buildInfo: {
    version: '1.0.0-dev',
    buildDate: new Date().toISOString(),
    gitCommit: process.env['GIT_COMMIT'] || 'development'
  }
};

// ===============================================
// PATTERN 4: PRODUCTION ENVIRONMENT
// ===============================================

/**
 * ✅ Production-optimized configuration
 * Used during: ng build, ng build --configuration production
 */
export const productionEnvironment: Environment = {
  production: true,
  GOOGLE_API_KEY: '', // ✅ API keys provided by users through modal for security

  // ✅ Production-optimized settings
  apiBaseUrl: 'https://api.yourdomain.com',
  enableLogging: false,         // ✅ Minimal logging in production
  enableAnalytics: true,        // ✅ Enable analytics for insights
  maxRetries: 5,                // ✅ More retries for reliability
  timeout: 15000,               // ✅ Shorter timeout for better UX

  features: {
    experimentalFeatures: false, // ✅ Disable experimental features
    debugMode: false,
    offlineMode: false
  },

  buildInfo: {
    version: process.env['APP_VERSION'] || '1.0.0',
    buildDate: new Date().toISOString(),
    gitCommit: process.env['GIT_COMMIT'] || 'unknown'
  }
};

// ===============================================
// PATTERN 5: ENVIRONMENT VALIDATION
// ===============================================

/**
 * ✅ Runtime environment validation
 * Ensures required configuration is present
 */
export function validateEnvironment(env: Environment): void {
  const errors: string[] = [];

  // ✅ Check required properties
  if (typeof env.production !== 'boolean') {
    errors.push('production flag must be a boolean');
  }

  // ✅ Validate API URLs if provided
  if (env.apiBaseUrl && !isValidUrl(env.apiBaseUrl)) {
    errors.push('apiBaseUrl must be a valid URL');
  }

  // ✅ Validate numeric ranges
  if (env.maxRetries !== undefined && (env.maxRetries < 0 || env.maxRetries > 10)) {
    errors.push('maxRetries must be between 0 and 10');
  }

  if (env.timeout !== undefined && env.timeout < 1000) {
    errors.push('timeout must be at least 1000ms');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

// ===============================================
// PATTERN 6: ENVIRONMENT UTILITIES
// ===============================================

/**
 * ✅ Environment detection utilities
 */
export class EnvironmentUtils {
  static isDevelopment(env: Environment): boolean {
    return !env.production;
  }

  static isProduction(env: Environment): boolean {
    return env.production;
  }

  static isFeatureEnabled(env: Environment, feature: string): boolean {
    return env.features?.[feature] === true;
  }

  static getApiUrl(env: Environment, endpoint: string): string {
    const baseUrl = env.apiBaseUrl || '';
    return `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  }

  static shouldLog(env: Environment, level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (!env.enableLogging) return false;

    // ✅ Different log levels based on environment
    if (env.production) {
      return ['warn', 'error'].includes(level);
    } else {
      return true; // All levels in development
    }
  }
}

// ===============================================
// PATTERN 7: TYPE-SAFE ENVIRONMENT ACCESS
// ===============================================

/**
 * ✅ Type-safe environment service
 * Provides strongly-typed access to environment configuration
 */
export class EnvironmentService {
  private readonly env: Environment;

  constructor(environment: Environment) {
    validateEnvironment(environment);
    this.env = environment;
  }

  get isProduction(): boolean {
    return this.env.production;
  }

  get isDevelopment(): boolean {
    return !this.env.production;
  }

  get apiBaseUrl(): string {
    return this.env.apiBaseUrl || '';
  }

  get loggingEnabled(): boolean {
    return this.env.enableLogging === true;
  }

  get buildInfo(): Environment['buildInfo'] {
    return this.env.buildInfo;
  }

  isFeatureEnabled(feature: string): boolean {
    return EnvironmentUtils.isFeatureEnabled(this.env, feature);
  }

  getApiUrl(endpoint: string): string {
    return EnvironmentUtils.getApiUrl(this.env, endpoint);
  }

  shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    return EnvironmentUtils.shouldLog(this.env, level);
  }

  // ✅ Get configuration for external services
  getRetryConfig() {
    return {
      maxRetries: this.env.maxRetries || 3,
      timeout: this.env.timeout || 30000
    };
  }
}

// ===============================================
// PATTERN 8: ENVIRONMENT-SPECIFIC PROVIDERS
// ===============================================

import { Injectable, InjectionToken } from '@angular/core';

/**
 * ✅ Injection token for environment
 */
export const ENVIRONMENT = new InjectionToken<Environment>('Environment');

/**
 * ✅ Angular service that provides environment configuration
 */
@Injectable({
  providedIn: 'root'
})
export class AppEnvironmentService extends EnvironmentService {
  constructor() {
    // ✅ This would be injected in a real application
    super(environment);
  }
}

// ===============================================
// HELPER FUNCTIONS
// ===============================================

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// ===============================================
// USAGE EXAMPLES
// ===============================================

/**
 * Example usage in a component:
 *
 * ```typescript
 * export class MyComponent {
 *   private envService = inject(AppEnvironmentService);
 *
 *   ngOnInit() {
 *     if (this.envService.isFeatureEnabled('experimentalFeatures')) {
 *       // Enable experimental UI
 *     }
 *
 *     const apiUrl = this.envService.getApiUrl('users');
 *     // Use apiUrl for HTTP requests
 *   }
 * }
 * ```
 *
 * Example usage in a service:
 *
 * ```typescript
 * export class ApiService {
 *   private envService = inject(AppEnvironmentService);
 *
 *   private makeRequest() {
 *     const config = this.envService.getRetryConfig();
 *     // Use config for HTTP client setup
 *
 *     if (this.envService.shouldLog('debug')) {
 *       console.debug('Making API request...');
 *     }
 *   }
 * }
 * ```
 */

/**
 * ===============================================
 * ENVIRONMENT PATTERN SUMMARY
 * ===============================================
 *
 * KEY CONVENTIONS TO FOLLOW:
 *
 * 1. ALWAYS define a strict TypeScript interface for environments
 * 2. ALWAYS validate environment configuration at runtime
 * 3. ALWAYS use empty strings for sensitive data (let users provide)
 * 4. ALWAYS provide different configurations for dev/prod
 * 5. ALWAYS include feature flags for conditional functionality
 * 6. ALWAYS include build information for debugging
 * 7. ALWAYS use environment-specific API URLs and timeouts
 * 8. ALWAYS validate URLs and numeric ranges
 * 9. ALWAYS provide utility functions for common operations
 * 10. ALWAYS use Angular injection tokens for testability
 *
 * SECURITY PATTERNS:
 * - Never commit API keys or secrets to version control
 * - Use user-provided API keys for third-party services
 * - Different logging levels for different environments
 * - Disable debug features in production
 *
 * FEATURE FLAGS:
 * - Use feature flags to enable/disable functionality
 * - Different feature sets for different environments
 * - Easy way to roll out experimental features
 * - A/B testing capabilities
 *
 * BUILD INFORMATION:
 * - Include version, build date, and git commit
 * - Use environment variables in build process
 * - Helpful for debugging production issues
 * - Track deployments and rollbacks
 *
 * TYPE SAFETY:
 * - Strongly-typed environment interface
 * - Runtime validation of configuration
 * - Type-safe service for accessing environment
 * - Compile-time checks for required properties
 */