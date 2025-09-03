import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  router = inject(Router); // Inyecta el Router para redirigir

  canActivate(
    route: ActivatedRouteSnapshot, 
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return new Promise((resolve) => {
      this.firebaseSvc.getAuth().onAuthStateChanged((auth) => {
        if (auth) {
          // Si el usuario está autenticado, redirigir a /main/home
          this.router.navigate(['/main/home']);
          resolve(false); // No permitir el acceso a la ruta protegida
        } else {
          // Si el usuario no está autenticado, permitir el acceso
          resolve(true);
        }
      });
    });
  }
}