import { Component, inject } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { UtilsService } from './services/utils.service';
// import { SplashScreen } from '@capacitor/splash-screen';
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

  //async showSplash() {
  //  await SplashScreen.show({
  //    autoHide: true,
  //    showDuration: 3000
  //  });
  //}
}

//const app = initializeApp(environment.firebaseConfig);
//if (window.location.hostname === 'localhost') {
//  //Connect with Auth emulator (replace port with yours if different)
//   const auth = getAuth(app);
//    connectAuthEmulator(auth, 'http://localhost:9099');
//  // Connect with Storage emulator (replace port with yours if different)
//  const storage = getStorage(app);
//  connectStorageEmulator(storage, 'localhost', 9198); // Default Storage emulator port
//  // Connect with Firestore emulator (replace port with yours if different)
//  const firestore = getFirestore(app);
//  connectFirestoreEmulator(firestore, 'localhost', 8089);
//}
