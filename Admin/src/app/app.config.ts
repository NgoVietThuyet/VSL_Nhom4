import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import vi from '@angular/common/locales/vi';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNzI18n, vi_VN } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

registerLocaleData(vi);
const icons: IconDefinition[] = Object.values(AllIcons);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNzI18n(vi_VN),
    provideNzIcons(icons),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimationsAsync()
  ]
};
