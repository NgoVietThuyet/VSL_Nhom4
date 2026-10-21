import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, RouteReuseStrategy, Router } from '@angular/router';
import { routes } from './app.routes';
import { vi_VN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import vi from '@angular/common/locales/vi';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { CredentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { ApiRequestInterceptor } from './core/interceptors/api-request.interceptor';
import { LicenseInterceptor } from './core/interceptors/license.interceptor';
import { TokenService } from './core/services/token.service';
import AuthGuard from './core/guards/auth.guard';
import UnauthGuard from './core/guards/unauth.guard';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import { ReuseStrategyConfig } from './core/config/route-reuse-strategy.config';
import { LicenseService, LICENSE_INVALID_CODES } from './core/services/license.service';
import { APP_INITIALIZER } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService  } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

registerLocaleData(vi);
const icons: IconDefinition[] = Object.values(AllIcons);

export function initAuthSession(tokenService: TokenService) {
  return () => firstValueFrom(tokenService.ensureSession()).catch(() => false);
}

export function initLicense(licenseService: LicenseService, router: Router) {
  return async () => {
    if (typeof window !== 'undefined' && window.location?.pathname?.startsWith('/license-expired')) {
      return;
    }
    try {
      const status = await firstValueFrom(licenseService.getStatus(false));
      if (!status?.isValid && LICENSE_INVALID_CODES.includes(status?.code || '')) {
        router.navigate(['/license-expired']);
      }
    } catch { }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: ReuseStrategyConfig },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNzI18n(vi_VN),

    importProvidersFrom(
      FormsModule,
      NzModalModule,
      NzMessageService
    ),

    provideNzIcons(icons),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([ApiRequestInterceptor, CredentialsInterceptor, AuthInterceptor, LicenseInterceptor])),
    AuthGuard,
    UnauthGuard,
    {
      provide: APP_INITIALIZER,
      useFactory: initAuthSession,
      deps: [TokenService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initLicense,
      deps: [LicenseService, Router],
      multi: true
    },
  ]
};
