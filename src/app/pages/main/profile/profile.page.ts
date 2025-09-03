import { Component, OnInit, inject } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy, where } from 'firebase/firestore';
import { getAuth, deleteUser, updateEmail, updatePassword } from 'firebase/auth';
import { getFirestore, updateDoc, doc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { verifyBeforeUpdateEmail } from 'firebase/auth';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';

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
    private router: Router
    ) {}
  
 
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
  const path = `usuarios_global/${user.uid}`;
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
    this.utilsSvc.routerLink('/auth');

  } catch (error) {
    console.error('Error updating user:', error);
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
 async deleteUsuario(user: User){
  let path = `usuarios_global/${user.uid}`;
  const loading = await this.utilsSvc.loading();
  await loading.present();

  // Eliminar usuario de la base de datos Firestore
  this.firebaseSvc.deleteDocument(path).then(async res => {
    // Eliminar usuario de la autenticación
    const auth = getAuth();
    deleteUser(auth.currentUser).then(() => {
      this.utilsSvc.presentToast({ 
        message: 'Usuario eliminado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
      this.router.navigate(['/auth']);
    }).catch(error => {
      console.log(error);
      this.utilsSvc.presentToast({ 
        message: error.message,
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    });
  }).catch(error => {
    console.log(error);
    this.utilsSvc.presentToast({ 
      message: error.message,
      duration: 1500,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
    });
  }).finally(() => {
    loading.dismiss();
  });
}
 
   


 ngOnInit() {
  
  this.user = this.getUserFromLocalStorage(); // Asigna el usuario recuperado del almacenamiento local
}

  getUserFromLocalStorage(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

   

   async takeImage() {

  
    let user = this.user;

   // let path = `usuarios/${user.uid}`; //Esta es la coleccion
    
    let path = `usuarios_global/${user.uid}`;
    
    const dataUrl = (await this.utilsSvc.takePicture('Seleccionar una opcion')).dataUrl;

    const loading = await this.utilsSvc.loading();
    await loading.present();
  
    let imagePath = `${user.uid}/profile`;
    user.image = await this.firebaseSvc.uploadImage(imagePath, dataUrl);

    this.firebaseSvc.updateDocument(path, {image: user.image }).then(async res => {

       this.utilsSvc.saveInLocalStorage('user', user);
  
  
        this.utilsSvc.presentToast({ 
          message: 'Imagen actualizada exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        })
        //Codigo de error 
  
       
      }).catch(error => {
        console.log(error);
  
  
      this.utilsSvc.presentToast({ 
        message: error.message,
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      })
      //Codigo de error 
  
      }).finally(() => {
        loading.dismiss();
      })

  }

}
