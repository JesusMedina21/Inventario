import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {

  form = new FormGroup({

    email: new FormControl('', [Validators.required, Validators.email]),
  })
  //Campos del formulario login


  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService)

  ngOnInit() {
  }

  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      try {
        const email = this.form.value.email;

        // Primero verificamos si el email existe en la base de datos
        const emailExists = await this.firebaseSvc.checkEmailExists(email);

        if (!emailExists) {
          // Si el email no existe, mostramos error
          this.utilsSvc.presentToast({
            message: 'Este correo no está registrado',
            duration: 1500,
            color: 'danger',
            position: 'middle',
            icon: 'alert-circle-outline'
          });
          return;
        }

        // Si el email existe, enviamos el correo de recuperación
        await this.firebaseSvc.sendRecoveryEmail(email);

        this.utilsSvc.presentToast({
          message: 'Correo de recuperación enviado con éxito (REVISA EN SPAM)',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'mail-outline'
        });

        this.utilsSvc.routerLink('/');
        this.form.reset();

      } catch (error) {
        //console.log(error);
        this.utilsSvc.presentToast({
          message: 'Error al procesar la solicitud',
          duration: 1500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      } finally {
        loading.dismiss();
      }
    }
  }


}
