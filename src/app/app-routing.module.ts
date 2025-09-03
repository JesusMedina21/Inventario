import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NoAuthGuard } from './guards/no-auth.guard'; 
 
import { AuthGuard } from './guards/auth.guard';
const routes: Routes = [
  
  {
    path: '',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthPageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'main',
    loadChildren: () => import('./pages/main/main.module').then( m => m.MainPageModule),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'error',
    loadChildren: () => import('./error/error.module').then( m => m.ErrorPageModule)
  },
  {
    path: '**',
    redirectTo: 'error'  // Redirige a la página de error para rutas no encontradas
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
