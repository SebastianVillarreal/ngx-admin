import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Route, UrlSegment, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate, CanLoad {
  constructor(private auth: AuthService, private router: Router) {}

  private check(): boolean | UrlTree {
    if (this.auth.isAuthenticated()) {
      // Ya autenticado: ir a pages
      return this.router.parseUrl('/pages');
    }
    // Invitado: permitir acceso al login
    return true;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.check();
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    return this.check();
  }
}
