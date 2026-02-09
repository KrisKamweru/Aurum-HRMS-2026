import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { api } from '../convex/_generated/api';
import { environment } from './environments/environment';

if (!environment.production && typeof window !== 'undefined') {
  (window as any).__aurumApi = api;
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
