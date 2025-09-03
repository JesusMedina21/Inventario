import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CategoriaComponent } from 'src/app/shared/components/categoria/categoria.component';
import { Categoria } from 'src/app/models/categoria.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { orderBy, where } from 'firebase/firestore';



@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.page.html',
  styleUrls: ['./categoria.page.scss'],
})

export class CategoriaPage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  categorias: Categoria[] = [];
  allCategorias: Categoria[] = []; // Nueva propiedad para almacenar la lista original
  loading: boolean = false;
  isConnected: boolean = navigator.onLine;
  searchTerm: string = ''; // Propiedad para el término de búsqueda
  filteredCategorias: Categoria[] = []; // Lista filtrada de categorías
 
  clearSearch() {
    this.searchTerm = ''; // Restablece el término de búsqueda
    this.filteredCategorias = [...this.allCategorias]; // Muestra todas las categorías
  }
 
  filterCategorias() {
    if (this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase(); // Convertir el término de búsqueda a minúsculas
      this.filteredCategorias = this.allCategorias.filter(categoria => {
        return categoria.nombre.toLowerCase().includes(searchTermLower);
      });
    } else {
      this.filteredCategorias = [...this.allCategorias]; // Si el campo de búsqueda está vacío, muestra todas las categorías nuevamente
    }
  }

  constructor(
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
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getCategorias();
  }
  //Reiniciar pagina
  doRefresh(event) {
    
    setTimeout(() => {
     this.getCategorias(),
      event.target.complete();
    }, 1000);
  }

  //Orden de categorias
  getCategorias() {
    let path = `categorias`;
    this.loading = true;
    let query = [
      orderBy('nombre', 'desc'),
    ];
    this.firebaseSvc
      .getCollectionData(path, query)
      .subscribe({
        next: (res: any) => {
          this.allCategorias = res.map((categorias: Categoria) => {
            return categorias;
          });
          this.filteredCategorias = [...this.allCategorias]; // Inicializa la lista filtrada
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener los productos:', error);
          // Manejar los errores apropiadamente
        },
      });
  }
  // Agregar o actualizar producto  
  async addUpdateCategoria(categoria?: Categoria) {
    if (!this.isConnected) {
      this.utilsSvc.presentToast({
        message: 'Sin conexión a Internet. Por favor, intente más tarde.',
        duration: 2000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return; // Exit if there is no connection
    }
    let success = await this.utilsSvc.presentModal({
      component: CategoriaComponent,
      cssClass: 'add-update-modal',
      componentProps: { categoria }
    })

    if(success) this.getCategorias();
    }


async confirmDeleteCategoria(categoria: Categoria) {
   
  if (!this.isConnected) {
    this.utilsSvc.presentToast({
      message: 'Sin conexión a Internet. Por favor, intente más tarde.',
      duration: 2000,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
    });
    return; // Exit if there is no connection
  }

  this.utilsSvc.presentAlert({
    header: 'Borrar Categoria',
    message: 'Esta seguro de borrar la categoria? Esta accion es inremediable!',
    mode: 'ios',
    buttons: [
      {
        text: 'Cancelar',
      }, {
        text: 'Borrar',
        handler: () => {
          this.deleteCategoria(categoria)
        }
      }
    ]
  });

}


//Eliminar producto
async deleteCategoria(categoria: Categoria){


 // let path = `usuarios/${this.user().uid}/categorias/${categoria.id}`;
 let path = `categorias/${categoria.id}` 

  const loading = await this.utilsSvc.loading();
  await loading.present();


  
  
  this.firebaseSvc.deleteDocument(path).then(async res => {

  this.categorias = this.categorias.filter(p => p.id != categoria.id ); 

    this.utilsSvc.presentToast({ 
      message: 'Categoria eliminada exitosamente',
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
