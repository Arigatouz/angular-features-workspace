import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'text-generation',
    loadComponent: async () => (await import('./components/text-generation/text-generation')).TextGeneration
  },
  {
    path: '',
    redirectTo: 'text-generation',
    pathMatch: 'full'
  }
];
