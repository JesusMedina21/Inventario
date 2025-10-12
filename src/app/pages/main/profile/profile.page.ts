import { Component, OnInit, inject } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { getAuth, deleteUser, updateEmail, updatePassword } from 'firebase/auth';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { CloudinaryService } from 'src/app/services/cloudinary.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {


  user: User; // Declara la propiedad user
  form = new FormGroup({
    uid: new FormControl(''),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmpassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)])
  });
  loading: boolean = false;
  showForm: boolean = false;

  constructor(
    private firebaseSvc: FirebaseService,
    private utilsSvc: UtilsService,
    private router: Router,
    private cloudinarySvc: CloudinaryService // inyecta Cloudinary
  ) { }


  //Reiniciar pagina
  doRefresh(event) {

    setTimeout(() => {
      this.getCategorias(),
        event.target.complete();
    }, 1000);
  }


  getCategorias() {
    // let path = `usuarios/${this.user().uid}/categorias`;


    this.loading = true;


  }


  async confirmDeleteUsuario(user: User) {
    this.utilsSvc.presentAlert({
      header: 'Borrar Cuenta',
      message: 'Esta seguro de borrar tu Cuenta?? Esta accion es inremediable!',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        }, {
          text: 'Borrar',
          handler: () => {
            this.deleteUsuario(user)
          }
        }
      ]
    });

  }


  async updateUser() {
    if (this.form.valid) {
      const password = this.form.get('confirmpassword').value;
      const confirmPassword = this.form.get('password').value;

      // Validar si las contraseñas coinciden
      if (password !== confirmPassword) {
        this.form.setErrors({ passwordsNotMatch: true }); // Agregar error al formulario
        return; // No continuar si las contraseñas no coinciden
      }
    }
    const user = this.user;
    const path = `usuarios/${user.uid}`;
    const updatedUser: User = {
      ...user,
      password: this.form.value.password,
      name: this.form.value.name,
    };
    try {
      // Update user in database (assuming successful update)
      await this.firebaseSvc.updateDocument(path, updatedUser);
      // Update user email in authentication
      const auth = getAuth();
      const currentUser = auth.currentUser;
      // Update user password in authentication (if password changed)
      if (updatedUser.password !== user.password) {
        await updatePassword(currentUser, updatedUser.password);
      }
      // Local storage update (optional, consider security implications)
      this.utilsSvc.saveInLocalStorage('user', updatedUser);
      this.utilsSvc.presentToast({
        message: 'Usuario actualizado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline',
      });

      // Redirigir al usuario a la página main/auth
      this.utilsSvc.routerLink('/');

    } catch (error) {
      //console.error('Error updating user:', error);
      this.utilsSvc.presentToast({
        message: 'Ocurrió un error al actualizar el usuario',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline',
      });
    }
  }



  //Eliminar Usuario
  async deleteUsuario(user: User) {
    const path = `usuarios/${user.uid}`;
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      // 🧹 1️⃣ Si el usuario tiene una imagen, eliminarla de Cloudinary primero
      if (user.image_public_id) {
        await this.cloudinarySvc.deleteImageProfile(user.image_public_id).toPromise();
      }

      // 🗑️ 2️⃣ Eliminar usuario del Firestore
      await this.firebaseSvc.deleteDocument(path);

      // 🔐 3️⃣ Eliminar usuario de Firebase Auth
      const auth = getAuth();
      await deleteUser(auth.currentUser);

      // ✅ 4️⃣ Confirmar éxito
      this.utilsSvc.presentToast({
        message: 'Usuario eliminado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });

      // 🚪 Redirigir al inicio
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      this.utilsSvc.presentToast({
        message: 'Error al eliminar usuario o imagen',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      // 🔄 Cerrar loading siempre
      loading.dismiss();
    }
  }





  ngOnInit() {

    this.user = this.getUserFromLocalStorage(); // Asigna el usuario recuperado del almacenamiento local
  }

  getUserFromLocalStorage(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }



  async takeImage() {
    const user = this.user;
    const path = `usuarios/${user.uid}`;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      const photo = await this.utilsSvc.takePicture('Seleccionar una opción');
      const dataUrl = photo.dataUrl;


      // Eliminar imagen anterior (si existe y tiene publicId)
      if (user.image_public_id) {
        await this.cloudinarySvc.deleteImageProfile(user.image_public_id).toPromise();
      }

      // Subir nueva imagen
      const response: any = await this.cloudinarySvc.uploadImageProfile(dataUrl).toPromise();

      user.image = response.secure_url;
      user.image_public_id = response.public_id; // guardar también el id

      await this.firebaseSvc.updateDocument(path, {
        image: user.image,
        image_public_id: user.image_public_id,
      });

      this.utilsSvc.saveInLocalStorage('user', user);
      this.utilsSvc.presentToast({
        message: 'Imagen actualizada exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    } catch (error) {
      //console.error('Error subiendo imagen:', error);
      this.utilsSvc.presentToast({
        message: 'Error al subir la imagen',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      // 💡 Siempre cerrar el loading, pase lo que pase
      loading.dismiss();
    }
  }


}
