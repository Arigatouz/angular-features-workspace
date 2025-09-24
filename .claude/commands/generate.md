# Angular Generate Command

## Usage

```
/generate <type> <name> [options]
```

## Description

Quick generator for common Angular artifacts following project patterns.

## Types

- `component` - Generate a standalone component
- `service` - Generate an injectable service
- `pipe` - Generate a standalone pipe
- `guard` - Generate a functional guard
- `interface` - Generate TypeScript interface
- `enum` - Generate TypeScript enum

## Examples

```bash
# Generate service
/generate service user-data

# Generate pipe
/generate pipe currency-format

# Generate interface
/generate interface api-response

# Generate guard
/generate guard auth

# Generate component (shorthand for /ui-component)
/generate component notification-toast --material
```

## Quick Service Template

```typescript
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class {{ServiceName}}Service {
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {}

  // Service methods
}
```

## Quick Pipe Template

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: '{{pipeName}}',
  standalone: true
})
export class {{PipeName}}Pipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    // Pipe transformation logic
    return value;
  }
}
```

## Quick Guard Template

```typescript
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';

export const {{guardName}}Guard: CanActivateFn = (route, state) => {
  // Guard logic
  return true;
};
```

## Locations

- **Services**: `projects/ai-agent/src/app/services/`
- **Components**: `projects/ai-agent/src/app/components/`
- **Pipes**: `projects/ai-agent/src/app/pipes/`
- **Guards**: `projects/ai-agent/src/app/guards/`
- **Interfaces**: `projects/ai-agent/src/app/interfaces/`
- **Enums**: `projects/ai-agent/src/app/enums/`