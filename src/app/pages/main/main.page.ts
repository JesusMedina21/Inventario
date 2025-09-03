import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit {

  pages = [
    { title: 'Productos', url: '/main/home', icon: 'home-outline' },
    { title: 'Perfil', url: '/main/profile', icon: 'person-outline' },
    { title: 'Historial', url: '/main/historial', icon: 'grid-outline' },
    { title: 'Web', url: 'https://tuinventario.vercel.app/', icon: 'globe-outline'},
    //{ title: 'APK', url: 'https://drive.google.com/file/d/1OWO2uanzPtBOFOyPRgTt8M894aoLzh_S/view?usp=sharing', icon: 'logo-android' },

  ]

  router = inject(Router);

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);


  currentPath: string = '';

  ngOnInit() {
    this.router.events.subscribe((event: any) => {
      if (event?.url) this.currentPath = event.url;

    })
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }


  //Cerrar sesion
  signOut() {
    this.firebaseSvc.signOut();
  }
  redirectTo(url: string) {
    window.open(url, '_blank'); // Abre la URL en una nueva pestaña
  }

}
