import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {

  form = new FormGroup({

    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    confirmpassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])

    //Campos del formulario login

  })

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService)

  ngOnInit() {
  }

  async submit() {
    if (this.form.valid) {
      const password = this.form.get('confirmpassword').value;
      const confirmPassword = this.form.get('password').value;

      // ✅ Validar si las contraseñas coinciden
      if (password !== confirmPassword) {
        this.form.setErrors({ passwordsNotMatch: true });
        return;
      }

      const loading = await this.utilsSvc.loading();
      await loading.present();

      this.firebaseSvc.signUp(this.form.value as User)
        .then(async res => {
          // ✅ Obtener token
          const token = await res.user.getIdToken();

          // ✅ Crear objeto seguro del usuario
          const userData = {
            uid: res.user.uid,
            email: res.user.email,
            name: this.form.value.name,
            token: token
          };

          // ✅ Guardar en Firestore
          await this.firebaseSvc.setDocument(`usuarios/${res.user.uid}`, userData);

          // ✅ Guardar en localStorage
          this.utilsSvc.saveInLocalStorage('user', userData);

          // ✅ Redirigir al home
          this.utilsSvc.routerLink('/main/home');

          // ✅ Mostrar mensaje de bienvenida
          this.utilsSvc.presentToast({
            message: `Bienvenido ${userData.name}`,
            duration: 1500,
            color: 'success',
            position: 'middle',
            icon: 'person-circle-outline'
          });
        })
        .catch(error => {
          //console.error(error);
          this.utilsSvc.presentToast({
            message: 'Error al crear la cuenta: ' + (error.message || ''),
            duration: 2000,
            color: 'danger',
            position: 'middle',
            icon: 'alert-circle-outline'
          });
        })
        .finally(() => {
          // ✅ Siempre cerrar el loading, ocurra lo que ocurra
          loading.dismiss();
        });
    }
  }


  async setUserInfo(uid: string) {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();
      //   let path = `usuarios/${uid}`;
      let path = `usuarios/${uid}`;
      delete this.form.value.confirmpassword;
      this.firebaseSvc.setDocument(path, this.form.value).then(async res => {
        this.utilsSvc.saveInLocalStorage('user', this.form.value);
        //--------------------------Aqui redirecciono al home-------------//
        this.utilsSvc.routerLink('/main/home');
        this.form.reset();

        // Obtener el nombre de usuario del formulario
        const user = this.form.value;

        // Verificar si el nombre de usuario está definido
        if (user.name) {
          // Mostrar mensaje de bienvenida con el nombre del usuario
          this.utilsSvc.presentToast({
            message: `Bienvenido ${user.name}`,
            duration: 1500,
            color: 'success',
            position: 'middle',
            icon: 'person-circle-outline'
          });
        } else {
          // Mostrar mensaje genérico si el nombre de usuario no está definido
          this.utilsSvc.presentToast({
            message: `Bienvenido`,
            duration: 1500,
            color: 'success',
            position: 'middle',
            icon: 'person-circle-outline'
          });
        }

      }).catch(error => {
        //console.log(error);
        this.utilsSvc.presentToast({
          message: 'Ya existe un usuario con este correo',
          duration: 1500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
          //Codigo de error 
        });
      }).finally(() => {
        loading.dismiss();
      });
    }
  }

}
