import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {


  constructor(private router: Router) { }


  form = new FormGroup({

    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])

    //Campos del formulario login

  })

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService)

  ngOnInit() {
    this.utilsSvc.setIsAuthPage(true);
    this.utilsSvc.changeTitle('TU INVENTARIO');
  }

  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();
      this.firebaseSvc.signIn(this.form.value as User).then(res => {
        this.getUserInfo(res.user.uid);
      }).catch(error => {
        //console.log(error);
        let message = error.message; // Default message

        // Check for specific error codes
        if (error.code === 'auth/network-request-failed') {
          message = 'Sin conexión a Internet. Por favor, intente más tarde.';
          this.router.navigate(['/']);
        } else if (error.code === 'auth/invalid-credential') {
          message = 'Sus datos son incorrectos';
          this.router.navigate(['/']);
        }


        this.utilsSvc.presentToast({
          message: message,
          duration: 1500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      }).finally(() => {
        loading.dismiss();
      });
    }
  }

  async getUserInfo(uid: string) {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();
      let path = `usuarios/${uid}`;
      delete this.form.value.password;

      this.firebaseSvc.getDocument(path).then((user: User) => {
        this.utilsSvc.saveInLocalStorage('user', user);
        this.utilsSvc.updateTitleForUser(user);
        this.utilsSvc.setIsAuthPage(false);
        this.utilsSvc.routerLink('/main/home');
        this.form.reset();
        this.utilsSvc.presentToast({
          message: `¡Te damos la Bienvenida ${user.name}!`,
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'person-circle-outline'
        });
      }).catch(error => {
        //console.log(error);
        let message = error.message; // Mensaje por defecto

        // Verifica si el error es de conexión
        if (error.code === 'auth/network-request-failed') {
          message = 'Conexion de internet muy baja, intente mas tarde';
        }

        this.utilsSvc.presentToast({
          message: message,
          duration: 1500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      }).finally(() => {
        loading.dismiss();
      });
    }
  }
}
