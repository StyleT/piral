import type { Subscription } from 'rxjs';
import type { ComponentContext, Disposable } from 'piral-core';
import { Inject, Injectable, NgZone, OnDestroy, Optional } from '@angular/core';
import { NavigationError, Router, Scroll } from '@angular/router';
import { ɵBrowserPlatformLocation } from '@angular/common';

const noop = function () {};

// deactivates the usual platform behavior; all these operations are performed via the RoutingService
// to avoid any conflict, e.g., double-booking URL changes in React and Angular
ɵBrowserPlatformLocation.prototype.pushState = noop;
ɵBrowserPlatformLocation.prototype.replaceState = noop;
ɵBrowserPlatformLocation.prototype.forward = noop;
ɵBrowserPlatformLocation.prototype.back = noop;
ɵBrowserPlatformLocation.prototype.historyGo = noop;

function normalize(url: string) {
  const search = url.indexOf('?');
  const hash = url.indexOf('#');

  if (search !== -1 || hash !== -1) {
    if (search === -1) {
      return url.substring(0, hash);
    } else if (hash === -1) {
      return url.substring(0, search);
    } else {
      return url.substring(0, Math.min(search, hash));
    }
  }

  return url;
}

@Injectable()
export class RoutingService implements OnDestroy {
  private dispose: Disposable | undefined;
  private subscription: Subscription | undefined;
  private invalidRoutes: Array<string> = [];

  constructor(
    @Inject('Context') public context: ComponentContext,
    @Optional() private router: Router,
    @Optional() private zone: NgZone,
  ) {
    if (this.router) {
      this.router.errorHandler = (error: Error) => {
        if (error.message.match('Cannot match any routes')) {
          // ignore this special error
          return undefined;
        }
        throw error;
      };

      const nav = this.context.navigation;

      this.dispose = nav.listen(({ location }) => {
        const path = location.pathname;

        if (!this.invalidRoutes.includes(path)) {
          const url = `${path}${location.search}${location.hash}`;
          this.zone.run(() => this.router.navigateByUrl(url));
        }
      });

      this.subscription = this.router.events.subscribe((e: NavigationError | Scroll) => {
        if (e instanceof NavigationError) {
          const routerUrl = e.url;
          const path = normalize(routerUrl);
          const locationUrl = nav.url;

          if (!this.invalidRoutes.includes(path)) {
            this.invalidRoutes.push(path);
          }

          if (routerUrl !== locationUrl) {
            nav.push(routerUrl);
          }
        } else if (e.type === 15) {
          // consistency check to avoid #535 and other Angular-specific issues
          const locationUrl = nav.url;
          const routerUrl = e.routerEvent.url;

          if (routerUrl !== locationUrl) {
            nav.push(routerUrl);
          }
        }
      });
    }
  }

  ngOnDestroy() {
    this.dispose?.();
    this.subscription?.unsubscribe();
  }
}
