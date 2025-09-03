import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { UtilsService } from '../services/utils.service';
import { onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
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
          // Si el usuario está autenticado
          resolve(true);
        } else {
          // Si el usuario no está autenticado, redirigir a la página de error
          this.router.navigate(['/']);
          resolve(false);
        }
      });
    });
  }
  
}
