import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ViewModeService } from '../services/view-mode.service';
import { WindowManagerService } from '../services/window-manager.service';

/**
 * When in Window Mode, intercept all child-route navigations.
 * If the URL corresponds to a known windowable route, open it as a window
 * and redirect the browser URL to the stable desktop shell.
 * Otherwise, allow navigation normally.
 */
@Injectable({ providedIn: 'root' })
export class WindowModeGuard implements CanActivateChild {
  constructor(
    private viewMode: ViewModeService,
    private windowManager: WindowManagerService,
    private router: Router,
  ) {}

  canActivateChild(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    if (!this.viewMode.isWindowMode) {
      return true; // not in window mode → proceed normally
    }

    const url = state.url; // e.g. '/task/board/xxx?workspaceId=yyy'
    const handled = this.windowManager.openRoute(url);
    return handled ? this.router.parseUrl('/desktop') : true;
  }
}
