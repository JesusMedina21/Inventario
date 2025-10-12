import { Component, inject } from '@angular/core';
import { Cloudinary, CloudinaryImage} from '@cloudinary/url-gen';
import { UtilsService } from './services/utils.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  utilsSvc = inject(UtilsService);
  constructor() {
    // Escuchar cambios en la autenticación
    window.addEventListener('userAuthStateChanged', () => {
      this.handleAuthStateChange();
    });

    // Verificar estado inicial
    this.handleAuthStateChange();
  }
  handleAuthStateChange() {
    const user = this.utilsSvc.getFromLocalStorage('user');
    if (user) {
      this.utilsSvc.updateTitleForUser(user);
      this.utilsSvc.setIsAuthPage(false);
    } else {
      this.utilsSvc.changeTitle('TU INVENTARIO');
      this.utilsSvc.setIsAuthPage(true);
    }
  }

}
