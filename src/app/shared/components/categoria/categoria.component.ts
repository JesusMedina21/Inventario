import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Categoria } from 'src/app/models/categoria.model';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.scss'],
})
export class CategoriaComponent implements OnInit {
  @Input() categoria: Categoria;
  products: Product[] = [];
  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(4), this.onlyLettersValidator]),
  });
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  user = {} as User;
  
  isConnected: boolean = navigator.onLine; // Estado de conexión
  isSubmitting: boolean = false; // Estado de envío

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    if (this.categoria) this.form.setValue(this.categoria);
    this.initializeNetworkEvents(); // Inicializar eventos de red
  }

  initializeNetworkEvents() {
    // Comprobar el estado de conexión inicial
    this.isConnected = navigator.onLine;
    // Agregar oyentes de eventos para eventos en línea y fuera de línea
    window.addEventListener('online', () => {
      console.log('Conectado a Internet');
      this.isConnected = true;
    });
    window.addEventListener('offline', () => {
      console.log('Conexión a Internet perdida');
      this.isConnected = false;
    });
  }

  submit() {
    if (this.isSubmitting) return; // Prevenir múltiples envíos
    if (!this.isConnected) {
      this.utilsSvc.presentToast({
        message: 'Sin conexión a Internet. Por favor, intente más tarde.',
        duration: 2000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return; // Salir si no hay conexión
    }

    this.isSubmitting = true; // Establecer el estado de envío
    if (this.form.valid) {
      if (this.categoria) {
        this.updateCategoria();
      } else {
        this.createCategoria();
      }
    } else {
      this.isSubmitting = false; // Restablecer el estado si el formulario es inválido
    }
  }

  onlyLettersValidator(control: FormControl) {
    const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!control.value.match(regex)) {
      return { onlyLetters: true };
    }
    return null;
  }

  // Crear categoría
  async createCategoria() {
    let path = `categorias`;
    const nombreCategoria = this.form.get('nombre').value;
    const categoriaExistente = await this.firebaseSvc.getDocumentByField(path, 'nombre', nombreCategoria);
    if (categoriaExistente) {
      this.utilsSvc.presentToast({
        message: 'Ya existe una categoría con este nombre',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      this.isSubmitting = false; // Restablecer el estado
      return;
    }
    const loading = await this.utilsSvc.loading();
    await loading.present();
    this.firebaseSvc.addDocument(path, this.form.value).then(async res => {
      this.utilsSvc.presentToast({
        message: 'Categoría creada exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
      this.utilsSvc.dismissModal({ success: true });
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
      this.isSubmitting = false; // Restablecer el estado
    });
  }

  // Actualizar categoría
  async updateCategoria() {
    let path = `categorias/${this.categoria.id}`;
    const loading = await this.utilsSvc.loading();
    await loading.present();
    const nombreCategoria = this.form.get('nombre').value;
    const categoriaExistente = await this.firebaseSvc.getDocumentByField('categorias', 'nombre', nombreCategoria);
    if (categoriaExistente && categoriaExistente['id'] !== this.categoria.id) {
      this.utilsSvc.presentToast({
        message: 'Ya existe una categoría con este nombre',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      loading.dismiss();
      this.isSubmitting = false; // Restablecer el estado
      return;
    }
    this.firebaseSvc.updateDocument(path, this.form.value).then(async res => {
      this.utilsSvc.presentToast({
        message: 'Categoría actualizada exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
      this.utilsSvc.dismissModal({ success: true });
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
      this.isSubmitting = false; // Restablecer el estado
    });
  }
}