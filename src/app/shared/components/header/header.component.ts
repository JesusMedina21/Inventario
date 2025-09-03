import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { UtilsService } from 'src/app/services/utils.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {

  @Input() title!: string;
  @Input() backButton!: string;
  @Input() isModal!: boolean;
  @Input() showMenu!: boolean;
  
  utilsSvc = inject(UtilsService);
  router = inject(Router);
  
  dynamicTitle: string = 'TU INVENTARIO';
  isAuthPage: boolean = true;
  
  private titleSubscription!: Subscription;
  private authPageSubscription!: Subscription;
  private routerSubscription!: Subscription;

  ngOnInit() {
    this.subscribeToTitleChanges();
    this.subscribeToAuthPageChanges();
    this.setupRouterListener();
  }

  ngOnDestroy() {
    if (this.titleSubscription) {
      this.titleSubscription.unsubscribe();
    }
    if (this.authPageSubscription) {
      this.authPageSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private subscribeToTitleChanges() {
    this.titleSubscription = this.utilsSvc.currentTitle.subscribe(title => {
      this.dynamicTitle = title;
    });
  }

  private subscribeToAuthPageChanges() {
    this.authPageSubscription = this.utilsSvc.currentIsAuthPage.subscribe(isAuth => {
      this.isAuthPage = isAuth;
    });
  }

  private setupRouterListener() {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitleBasedOnRoute();
    });
    
    // Actualizar también al inicializar
    this.updateTitleBasedOnRoute();
  }

  private updateTitleBasedOnRoute() {
    const currentRoute = this.router.url;
    const isAuth = currentRoute.includes('/auth');
    
    this.utilsSvc.setIsAuthPage(isAuth);
    
    if (isAuth) {
      this.utilsSvc.changeTitle('TU INVENTARIO');
    } else {
      const user = this.utilsSvc.getFromLocalStorage('user');
      this.utilsSvc.updateTitleForUser(user);
    }
  }

  dismissModal() {
    this.utilsSvc.dismissModal();
  }
}