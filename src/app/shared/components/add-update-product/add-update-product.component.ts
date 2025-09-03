import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder, } from '@angular/forms';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

import { orderBy, where } from 'firebase/firestore';
import { Categoria } from 'src/app/models/categoria.model';

@Component({
  selector: 'app-add-update-product',
  templateUrl: './add-update-product.component.html',
  styleUrls: ['./add-update-product.component.scss'],
})


export class AddUpdateProductComponent implements OnInit {

  
  form = new FormGroup({
    id: new FormControl(''),
    image: new FormControl('', [Validators.required]),
  //  codigo_barras: new FormControl('', [Validators.required, Validators.minLength(3), this.onlyLettersValidator]),
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    categoriaProducto: new FormControl('', [Validators.required]),
    precio: new FormControl(null, [Validators.required, Validators.min(1)]),
    Peso: new FormControl(null), 
    Cantidad: new FormControl(null, [Validators.required, Validators.min(0)]),        
    stock_min: new FormControl(null, [Validators.required, Validators.min(1)]),   
    stock_max: new FormControl(null, [Validators.required, Validators.min(1)]),   
  });
  @Input() product: Product;
  loading: boolean = false;
  user = {} as User;
  categorias: Categoria[] = [];
  selectedCategory: Categoria | null = null; // Add a property to store selected category
  products: Product[] = []; 
  
  isConnected: boolean = navigator.onLine; // Default to the current online status
  code: any;
  isSubmitting: boolean = false; // Step 1: Flag to track submission
  constructor(

    private firebaseSvc: FirebaseService, 
    private utilsSvc: UtilsService,
    private changeDetector: ChangeDetectorRef
  ) {this.initializeNetworkEvents();}

  
  initializeNetworkEvents() {
    // Check initial connection status
    this.isConnected = navigator.onLine;

    // Add event listeners for online and offline events
    window.addEventListener('online', () => {
      console.log('Conectado a Internet');
      this.isConnected = true;
      this.changeDetector.detectChanges(); // Notify Angular of the change
    });

    window.addEventListener('offline', () => {
      console.log('Conexión a Internet perdida');
      this.isConnected = false;
      this.changeDetector.detectChanges(); // Notify Angular of the change
    });
  }

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    
    // Si hay un producto, inicializa el formulario con sus datos
    if (this.product) {
      this.form.patchValue({
        id: this.product.id,
        name: this.product.name,
        precio: this.product.precio,
        Cantidad: this.product.Cantidad,
        stock_max: this.product.stock_max,
        stock_min: this.product.stock_min,
        Peso: this.product.Peso,
        image: this.product.image,
        categoriaProducto: this.product.categoriaProducto
      });
      this.selectedCategory = this.categorias.find(cat => cat.id === this.product.categoriaProducto); // Find matching category
      if (this.product.Peso ) { // Agregar esta condición
          this.changeProductType('granel');
      } else {
          this.changeProductType('unidades');
      }
    }

    
  }

  selectedProductType: string = 'unidades'; // Default to 'unidades'

  changeProductType(type: string) {
    this.selectedProductType = type;
    const PesoControl = this.form.get('Peso');
    const cantidadControl = this.form.get('Cantidad');
    const stockMinControl = this.form.get('stock_min');
    const stockMaxControl = this.form.get('stock_max');

    if (type === 'granel') {
        cantidadControl.clearValidators();
        PesoControl.setValidators([Validators.required, Validators.min(0)]); // Minimum weight of 0.01
        this.form.get('Cantidad').setValue(null);
    } else {
        cantidadControl.setValidators([Validators.required, Validators.min(0)]);
        stockMinControl.setValidators([Validators.required, Validators.min(1)]);
        stockMaxControl.setValidators([Validators.required, Validators.min(1)]);
        this.form.get('Peso').setValue(null);
        PesoControl.clearValidators();
    }

    cantidadControl.updateValueAndValidity();
    stockMinControl.updateValueAndValidity();
    stockMaxControl.updateValueAndValidity();
    PesoControl.updateValueAndValidity();
  }


  //----------------------Tomar/Seleccionar imagen-------------------//
  async takeImage() {
    const dataUrl = (await this.utilsSvc.takePicture('Imagen del producto')).dataUrl;
    this.form.controls.image.setValue(dataUrl);
  }


  //----------------------Tomar/Seleccionar imagen-------------------//
 // async takeImage() {
 //   const dataUrl = (await this.utilsSvc.takePicture('Imagen del producto')).dataUrl;
 //   this.form.controls.image.setValue(dataUrl);
 // }

 submit() {
  if (this.isSubmitting) return; // Prevent multiple submissions
  this.isSubmitting = true; // Step 2: Set the flag to true

  if (this.form.valid) {
      if (this.form.value.stock_max < this.form.value.stock_min) {
          this.utilsSvc.presentToast({
              message: 'El stock máximo no puede ser inferior al stock mínimo',
              duration: 1500,
              color: 'danger',
              position: 'middle',
              icon: 'alert-circle-outline'
          });
          this.isSubmitting = false; // Reset the flag if there's an error
      } else {
          // Clear fields based on the selected product type
          if (this.selectedProductType === 'unidades') {
              delete this.form.value.Peso;
          } else {
              delete this.form.value.Cantidad;
          }

          if (this.product) {
              this.updateProduct().finally(() => {
                  this.isSubmitting = false; // Reset the flag after the update
              });
          } else {
              this.createProduct().finally(() => {
                  this.isSubmitting = false; // Reset the flag after creation
              });
          }
      }
  } else {
      this.isSubmitting = false; // Reset the flag if the form is invalid
  }
}

setNumberInputs() {
  let { Cantidad, precio, Peso, stock_min, stock_max } = this.form.controls;
  if (Cantidad.value) Cantidad.setValue(parseFloat(Cantidad.value));
  if (precio.value) precio.setValue(parseFloat(precio.value));
  if (Peso.value) Peso.setValue(parseFloat(Peso.value));
  if (stock_min.value) stock_min.setValue(parseFloat(stock_min.value));
  if (stock_max.value) stock_max.setValue(parseFloat(stock_max.value));
 
}

cleanFormValues() {
  Object.keys(this.form.value).forEach(key => {
    if (this.form.value[key] === '' || this.form.value[key] === null) {
      delete this.form.value[key];
    }
  });
}
 
  async checkConnection() {
    if (!this.isConnected) {
      this.utilsSvc.presentToast({
        message: 'Sin conexión a Internet. Por favor, intente más tarde.',
        duration: 2000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return false; // Return false if there is no connection
    }
    return true; // Return true if there is a connection
  }

  //Crear producto
// Crear producto
async createProduct() {
  const connectionStatus = await this.checkConnection();
  if (!connectionStatus) {
    return; // Exit if there is no connection
  }

  let path = `productos`;
  const nombreProducto = this.form.get('name').value;
  const NombreExistente = await this.firebaseSvc.getDocumentByField(path, 'name', nombreProducto);
  
  if (NombreExistente) {
    this.utilsSvc.presentToast({
      message: 'Ya existe un producto con este nombre',
      duration: 1500,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
    });
  } else {
    // Cargando
    const loading = await this.utilsSvc.loading();
    await loading.present();
    
    // Subir la imagen y obtener la URL
    let dataUrl = this.form.value.image;
    let imagePath = `${this.user.uid}/${Date.now()}`;
    let imageUrl = await this.firebaseSvc.uploadImage(imagePath, dataUrl);
    this.form.controls.image.setValue(imageUrl);
    
    // Generar un ID único para el producto
    const productId = this.form.get('name').value.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now(); // Ejemplo de ID basado en el nombre y timestamp
    
    // Limpiar campos según el tipo de producto seleccionado
    if (this.selectedProductType === 'unidades') {
      delete this.form.value.Peso;
    } else {
      delete this.form.value.Cantidad;
    }
    
    // Guardar el producto usando setDoc con el ID generado
    this.firebaseSvc.setDocument(`${path}/${productId}`, { ...this.form.value, id: productId }).then(async res => {
      this.utilsSvc.presentToast({
        message: 'Producto creado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
      // Cerrar el modal solo si el producto se registra con éxito
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
    });
  }
}
 //Editar producto
 async updateProduct() {
  const connectionStatus = await this.checkConnection();
  if (!connectionStatus) {
    return; // Exit if there is no connection
  }

  //  let path = `usuarios/${this.user.uid}/productos/${this.product.id}`;
  let path = `productos/${this.product.id}`;
    const selectedCategory = this.categorias.find(cat => cat.id === this.form.value.categoriaProducto);
    if (selectedCategory) {
      this.form.value.categoriaProducto = selectedCategory.nombre; // Almacenar el nombre de la categoría para referencia
    } else {
      console.error("Selected category not found"); // Manejar un posible error
    }
    const nombreProducto = this.form.get('name').value;
    const ProductoExistente = await this.firebaseSvc.getDocumentByField('productos', 'name', nombreProducto);
  
    if (ProductoExistente && ProductoExistente['id'] !== this.product.id) {
      this.utilsSvc.presentToast({
        message: 'Ya existe un producto con este nombre',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }
  
    // Eliminar el campo "Cantidad" antes de asignar los valores al formulario
    delete this.form.value.Cantidad;
  
    const loading = await this.utilsSvc.loading();
    await loading.present();
  
    // Subir la imagen nueva y obtener la URL
    if (this.form.value.image !== this.product.image) {
      let dataUrl = this.form.value.image;
      let imagePath = await this.firebaseSvc.getFilePath(this.product.image);
      let imageUrl = await this.firebaseSvc.uploadImage(imagePath, dataUrl);
      this.form.controls.image.setValue(imageUrl);
    }
  
    this.cleanFormValues();
    delete this.form.value.id;
  
    this.firebaseSvc.updateDocument(path, this.form.value).then(async res => {
      this.utilsSvc.dismissModal({ success: true });
      this.utilsSvc.presentToast({
        message: 'Producto actualizado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
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

    ionViewWillEnter() {
      this.getCategorias();
    }
   
    getCategorias() {
     // let path = `usuarios/${this.user.uid}/categorias`;
     let path = `categorias`;
  
      this.loading = true;
  
      let query = [
        orderBy('nombre', 'desc') //Aqui ordeno las categorias por nombre
        //Orden de categorias
      ]
  
      let sub = this.firebaseSvc.getCollectionData(path, query).subscribe({
        next: (res: any) => {
          console.log(res);
          this.categorias = res;
  
          this.loading = false;
  
          sub.unsubscribe();
        }
      })
  
    }
  
    getCategoryName(categoryId: string): string {
      const category = this.categorias.find(cat => cat.id === categoryId);
      return category ? category.nombre : ''; // Return empty string if not found
    }

}