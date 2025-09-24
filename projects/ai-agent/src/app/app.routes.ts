import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'text-generation',
    loadComponent: async () => (await import('./components/text-generation/text-generation')).TextGeneration
  },
  {
    path: 'image-generation',
    loadComponent: async () => (await import('./components/image-generation/image-generation')).ImageGeneration
  },
  {
    path: '',
    redirectTo: 'text-generation',
    pathMatch: 'full'
  }
];
