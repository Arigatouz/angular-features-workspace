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
    path: 'text-to-speech',
    loadComponent: async () => (await import('./components/text-to-speech/text-to-speech')).TextToSpeechGeneration
  },
  {
    path: 'video-understanding',
    loadComponent: async () => (await import('./components/video-understanding/video-understanding')).VideoUnderstanding
  },
  {
    path: 'pdf-processing',
    loadComponent: async () => (await import('./components/pdf-processing/pdf-processing')).PdfProcessingComponent
  },
  {
    path: 'image-editing',
    loadComponent: async () => (await import('./components/image-editing/image-editing')).ImageEditingComponent
  },
  {
    path: 'point-of-interest',
    loadComponent: async () => (await import('./components/point-of-interest/point-of-interest')).PointOfInterest
  },
  {
    path: '',
    redirectTo: 'text-generation',
    pathMatch: 'full'
  }
];
