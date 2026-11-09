import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // BACK: en el proyecto real el HttpClient ya está configurado con sus
    // interceptores (http-interceptors-ppal.ts). No hay que duplicarlo allí.
    provideHttpClient(withFetch()),
  ],
};
