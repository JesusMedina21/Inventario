import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy, where } from 'firebase/firestore';
import { HistorialService } from 'src/app/services/historial.service';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { CloudinaryService } from 'src/app/services/cloudinary.service';
pdfMake.vfs = pdfFonts;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})


export class HomePage implements OnInit {
  originalProducts: Product[] = [];
  firebaseSvc = inject(FirebaseService);
  cloudinarySvc = inject(CloudinaryService);
  utilsSvc = inject(UtilsService);
  products: Product[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  pdfObject: any;

  isConnected: boolean = navigator.onLine; // Default to the current online status
  constructor(
    private historialService: HistorialService,
    private changeDetector: ChangeDetectorRef
  ) { this.initializeNetworkEvents(); }


  initializeNetworkEvents() {
    // Check initial connection status
    this.isConnected = navigator.onLine;

    // Add event listeners for online and offline events
    window.addEventListener('online', () => {
      //console.log('Conectado a Internet');
      this.isConnected = true;
      this.changeDetector.detectChanges(); // Notify Angular of the change
    });

    window.addEventListener('offline', () => {
      //console.log('Conexión a Internet perdida');
      this.isConnected = false;
      this.changeDetector.detectChanges(); // Notify Angular of the change
    });
  }



  async pdf() {
    const userName = this.user()?.name || 'Usuario';
    const fechaGeneracion = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let docDefinition: any = {
      content: [
        {
          stack: [
            { text: `INVENTARIO DE ${userName.toUpperCase()}`, alignment: 'center', bold: true, fontSize: 16, margin: [0, 0, 0, 5] },
            { text: `Generado el: ${fechaGeneracion}`, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 10] }
          ]
        }
      ],
      footer: function (currentPage: number, pageCount: number) {
        return [
          {
            text: 'Copyright © jesusmedina0921@gmail.com. Todos los derechos reservados.\n',
            alignment: 'center'
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'center'
          }
        ];
      },
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'white',
          fillColor: '#217283',
          alignment: 'center'
        }
      }
    };

    const maxProductsPerPage = 17;
    for (let i = 0; i < this.products.length; i += maxProductsPerPage) {
      const chunk = this.products.slice(i, i + maxProductsPerPage);
      const rows: any[] = [];

      // encabezado de tabla
      rows.push([
        { text: 'Producto', style: 'tableHeader' },
        { text: 'Precio', style: 'tableHeader' },
        { text: 'Inventario Actual', style: 'tableHeader' }
      ]);

      // filas dinámicas
      chunk.forEach((product, index) => {
        let displayText = '';

        if (product.Peso) {
          displayText = `${product.Peso} gramos`;
        } else if (product.Cantidad) {
          displayText = `${product.Cantidad} Unidades`;
        } else {
          displayText = 'Sin existencia';
        }

        rows.push([
          { text: `${i + index + 1}. ${product.name}`, margin: [0, 10, 0, 5] },
          { text: this.MostrarPrecioConPuntos(product), margin: [0, 10, 0, 5] },
          { text: displayText, margin: [0, 0, 0, 20] }
        ]);
      });

      docDefinition.content.push({
        table: {
          widths: ['*', '*', '*'],
          body: rows
        },
        layout: {
          fillColor: function (rowIndex: number) {
            return rowIndex === 0 ? '#0054e9' : null;
          }
        }
      });

      if (i + maxProductsPerPage < this.products.length) {
        docDefinition.content.push({ text: '', pageBreak: 'after' });
      }
    }

    // Crear el PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);

    if (Capacitor.isNativePlatform()) {
      pdfDoc.getBlob(async (blob) => {
        try {
          const base64 = await this.blobToBase64(blob);
          const fileName = `inventario_${new Date().getTime()}.pdf`;

          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
            recursive: true
          });

          const fileUri = await Filesystem.getUri({
            directory: Directory.Cache,
            path: fileName
          });

          await Share.share({
            title: 'Inventario',
            text: 'Inventario',
            url: fileUri.uri,
            dialogTitle: 'Abrir PDF con'
          });
        } catch (error: any) {
          alert('Error al abrir el PDF: ' + error.message);
        }
      });
    } else {
      pdfDoc.download('inventario.pdf');
    }
  }


  // Función auxiliar para convertir blob a base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }


  ngOnInit() {
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.verifyUserAndLoadProducts();
  }

  // Añade este método
  verifyUserAndLoadProducts() {
    const user = this.user();
    if (user && user.uid) {
      this.getProducts();
    } else {
      // Si no hay usuario, esperar y reintentar
      setTimeout(() => {
        this.verifyUserAndLoadProducts();
      }, 500);
    }
  }


  //Reiniciar pagina

  doRefresh(event) {

    setTimeout(() => {
      this.getProducts(),
        event.target.complete();
    }, 1000);
  }


  //Obtener ganacias

  getProfits() {
    const total = this.products.reduce((acc, product) => {
      if (product.Peso) {
        const pesoEnKg = product.Peso >= 1000 ? product.Peso / 1000 : product.Peso;
        return acc + (product.precio * pesoEnKg);
      } else if (isNaN(product.precio) || isNaN(product.Cantidad)) {
        return acc + 0; // Considerar NaN como 0
      } else {
        return acc + (product.precio * product.Cantidad);
      }
    }, 0);

    if (total.toString().length <= 3) {
      return total;
    } else {
      const formattedTotal = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return formattedTotal;
    }
  }




  private alertedProducts: Set<string> = new Set(); // Set para almacenar nombres de productos ya alertados

  AlertaStockMinimo(productName: string) {
    if (!this.alertedProducts.has(productName)) { // Verificar si el producto ya ha sido alertado
      this.utilsSvc.presentAlert({
        header: '¡Alerta de Stock Bajo!',
        message: `El producto "${productName}" está por agotarse.`,
        buttons: [
          { text: 'Entendido', role: 'cancel' },
        ],
      });
      this.alertedProducts.add(productName); // Agregar el producto al conjunto de productos alertados
    }
  }

  AlertaStockMaximo(productName: string) {
    if (!this.alertedProducts.has(productName)) { // Verificar si el producto ya ha sido alertado
      this.utilsSvc.presentAlert({
        header: '¡Alerta de Stock Excedido!',
        message: `El producto "${productName}" ha excedido el stock máximo.`,
        buttons: [
          { text: 'Entendido', role: 'cancel' },
        ],
      });
      this.alertedProducts.add(productName); // Agregar el producto al conjunto de productos alertados
    }
  }


  //Orden de productos
  getProducts() {

    let path = `usuarios/${this.user().uid}/productos`;

    //let path = `productos`;
    this.loading = true;
    let query = [
      orderBy('precio', 'desc'),
    ];
    this.firebaseSvc
      .getCollectionData(path, query)
      .subscribe({
        next: (res: any) => {
          this.products = res.map((product: Product) => {
            if (product.stock_min && (product.Peso < product.stock_min || product.Cantidad < product.stock_min)) {
              this.AlertaStockMinimo(product.name);
            }
            if (product.stock_max && (product.Peso > product.stock_max || product.Cantidad > product.stock_max)) {
              this.AlertaStockMaximo(product.name);
            }
            return product;
          });
          this.originalProducts = [...this.products]; // Almacena los productos originales
          this.loading = false;
        },
        error: (error) => {
          //console.error('Error al obtener los productos:', error);
        },
      });
  }
  async addUpdateProduct(product?: Product) {
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
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product }
    })

    if (success) this.getProducts();
  }

  // Agregar una función para determinar si mostrar el peso o la cantidad en el HTML
  MostrarStockActualConPuntos(product: Product): string {
    if (product.Peso !== undefined && product.Peso !== null) {
      const pesoString = product.Peso.toString();
      const pesoDigits = pesoString.length;

      if (pesoDigits > 3) {
        const formattedPeso = pesoString.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta un punto cada tres dígitos
        return `Stock Actual: ${formattedPeso} Gramos`;
      } else {
        return `Stock Actual: ${product.Peso} Gramos`;
      }
    } else {
      return `Stock Actual: ${product.Cantidad} Unidades`;
    }
  }

  MostrarStockMinConPuntos(product: Product): string {
    if (product.stock_min !== undefined && product.stock_min !== null) {
      const stockMinString = product.stock_min.toString();
      const stockMinDigits = stockMinString.length;

      let formattedStockMin: string;

      if (stockMinDigits > 3) {
        formattedStockMin = stockMinString.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Insert a dot every three digits
      } else {
        formattedStockMin = stockMinString;
      }

      if (product.Peso !== undefined && product.Peso !== null) {
        return `Stock Mínimo: ${formattedStockMin} Gramos`;
      } else if (product.Cantidad !== undefined && product.Cantidad !== null) {
        return `Stock Mínimo: ${formattedStockMin} Unidades`;
      } else {
        return `Stock Mínimo: ${formattedStockMin}`;
      }
    } else {
      return 'Stock Mínimo no definido';
    }
  }

  MostrarStockMaxConPuntos(product: Product): string {
    if (product.stock_max !== undefined && product.stock_max !== null) {
      const stockMaxString = product.stock_max.toString();
      const stockMaxDigits = stockMaxString.length;
      let formattedStockMax: string;
      if (stockMaxDigits > 3) {
        formattedStockMax = stockMaxString.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Insertar un punto cada tres dígitos
      } else {
        formattedStockMax = stockMaxString;
      }
      if (product.Peso !== undefined && product.Peso !== null) {
        return `Stock Máximo: ${formattedStockMax} Gramos`;
      } else if (product.Cantidad !== undefined && product.Cantidad !== null) {
        return `Stock Máximo: ${formattedStockMax} Unidades`;
      } else {
        return `Stock Máximo: ${formattedStockMax}`;
      }
    } else {
      return 'Stock Máximo no definido';
    }
  }

  MostrarPrecioConPuntos(product: Product): string {
    if (product.precio !== undefined && product.precio !== null) {
      const precioString = product.precio.toString();
      const precioDigits = precioString.length;

      if (precioDigits > 3) {
        const formattedprecio = precioString.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta un punto cada tres dígitos
        return `${formattedprecio} $`;
      } else {
        return `${product.precio} $`;
      }
    } else {
      return `Cantidad: ${product.Cantidad}`;
    }
  }

  InversionConPuntos(number: number): string {
    const formattedNumber = isNaN(number) ? '0' : number.toString();
    const digits = formattedNumber.length;
    if (digits > 3) {
      return formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta un punto cada tres dígitos
    }
    return formattedNumber;
  }



  async EntradaProducto(product: Product) {
    const alert = await this.utilsSvc.presentAlert({
      header: 'Agregar cantidad del Producto',
      message: '¿Está seguro de agregarle entrada al producto? ¡Esta acción es irreversible!',
      mode: 'ios',
      inputs: [
        {
          type: 'number',
          placeholder: product.Peso !== undefined ? 'Ingrese el peso entrante' : 'Ingrese las unidades entrante'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Agregar Producto',
          handler: async (data) => {
            const loading = await this.utilsSvc.loading(); // Mostrar loading
            await loading.present(); // Presentar loading
            try {
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
              let cantidadAgregada = parseFloat(data[0].trim()); // Trim the input
              // Validate that the input is not empty or whitespace and greater than 0
              if (isNaN(cantidadAgregada) || cantidadAgregada <= 0) {
                this.utilsSvc.presentToast({
                  message: 'La cantidad debe ser mayor a 0',
                  duration: 2000,
                  color: 'danger',
                  position: 'middle'
                });
                return; // Salir si la cantidad es 0 o menor
              }


              if (product.Peso !== null && product.Peso !== undefined) {
                product.Peso += cantidadAgregada; // Actualizar peso
              } else {
                product.Cantidad += cantidadAgregada; // Actualizar cantidad
              }

              const registro = { tipo: 'Entrada', producto: product, cantidadAgregada: cantidadAgregada, fecha: new Date() };
              ;


              this.historialService.agregarRegistro(registro);
              await this.actualizar_documento(product);
              this.utilsSvc.dismissModal({ success: true });
              this.utilsSvc.presentToast({
                message: 'Se agregó la entrada con éxito',
                duration: 1500,
                color: 'success',
                position: 'middle',
                icon: 'checkmark-circle-outline'
              });
            } catch (error) {
              //console.error(error);
              this.utilsSvc.presentToast({
                message: error.message,
                duration: 1500,
                color: 'danger',
                position: 'middle',
                icon: 'alert-circle-outline'
              });
            } finally {
              loading.dismiss(); // Ocultar loading
            }
          }
        },
      ]
    });
  }
  async SalidaProducto(product: Product) {
    // Verificar si el peso y la cantidad son cero
    if (product.Peso === 0) {
      this.utilsSvc.presentToast({
        message: 'No se puede agregar salida a un producto en 0',
        duration: 2000,
        color: 'danger',
        position: 'middle'
      });
      return; // Salir del método si el peso es 0
    }
    if (product.Cantidad === 0) {
      this.utilsSvc.presentToast({
        message: 'No se puede agregar salida a un producto en 0',
        duration: 2000,
        color: 'danger',
        position: 'middle'
      });
      return; // Salir del método si la cantidad es 0
    }
    const alert = await this.utilsSvc.presentAlert({
      header: 'Agregar salida del Producto',
      message: '¿Está seguro de agregarle salida al producto? ¡Esta acción es irreversible!',
      mode: 'ios',
      inputs: [
        {
          type: 'number',
          placeholder: product.Peso ? 'Ingrese el peso saliente' : 'Ingrese las unidades saliente'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Agregar Salida',
          handler: async (data) => {
            const loading = await this.utilsSvc.loading(); // Mostrar loading
            await loading.present(); // Presentar loading
            try {
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
              let cantidadSaliente = parseFloat(data[0].trim()); // Trim the input
              // Validate that the input is not empty or whitespace and greater than 0
              if (isNaN(cantidadSaliente) || cantidadSaliente <= 0) {
                this.utilsSvc.presentToast({
                  message: 'La cantidad debe ser mayor a 0',
                  duration: 2000,
                  color: 'danger',
                  position: 'middle'
                });
                return; // Salir si la cantidad es 0 o menor
              }


              if (product.Peso) {
                if (cantidadSaliente > product.Peso) {
                  this.utilsSvc.presentToast({
                    message: 'La salida no puede ser superior al stock actual',
                    duration: 2000,
                    color: 'danger',
                    position: 'middle'
                  });
                  return;
                }
                product.Peso -= cantidadSaliente;
              } else {
                if (cantidadSaliente > product.Cantidad) {
                  this.utilsSvc.presentToast({
                    message: 'La salida no puede ser superior al stock actual',
                    duration: 2000,
                    color: 'danger',
                    position: 'middle'
                  });
                  return;
                }
                product.Cantidad -= cantidadSaliente;
              }


              const registro = { tipo: 'Salida', producto: product, cantidadSaliente: cantidadSaliente, fecha: new Date() };

              this.historialService.agregarRegistro(registro);
              await this.actualizar_documento(product);
              this.utilsSvc.dismissModal({ success: true });
              this.utilsSvc.presentToast({
                message: 'Se agregó la Salida con éxito',
                duration: 1500,
                color: 'success',
                position: 'middle',
                icon: 'checkmark-circle-outline'
              });
            } catch (error) {
              //console.error(error);
              this.utilsSvc.presentToast({
                message: error.message,
                duration: 1500,
                color: 'danger',
                position: 'middle',
                icon: 'alert-circle-outline'
              });
            } finally {
              loading.dismiss(); // Ocultar loading
            }
          }
        },
      ]
    });
  }
  async actualizar_documento(product: Product) {
    const path = `usuarios/${this.user().uid}/productos/${product.id}`;
    //const path = `productos/${product.id}`;

    try {
      await this.firebaseSvc.updateDocument(path, product);
      //console.log('Producto actualizado en la colección de productos');
    } catch (error) {
      //console.error('Error al actualizar el producto en la colección de productos:', error);
      // Manejar el error según sea necesario
    }
  }

  async confirmDeleteProduct(product: Product) {
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
      header: 'Borrar Producto',
      message: '¿Está seguro de borrar el producto? Esta acción es irreversible!',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Borrar',
          handler: () => {
            this.deleteProduct(product); // Llama a la función de eliminación
          }
        }
      ]
    });
  }

  //Eliminar producto
  async deleteProduct(product: Product) {
    let path = `usuarios/${this.user().uid}/productos/${product.id}`;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    // Obtener publicId desde tu producto (ej: "inventario/miimagen123")
    const publicId = product.publicId;

    this.cloudinarySvc.deleteImage(publicId).subscribe({
      next: async () => {
        await this.firebaseSvc.deleteDocument(path);
        this.products = this.products.filter(p => p.id !== product.id);

        this.utilsSvc.presentToast({
          message: 'Producto eliminado exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        });
      },
      error: (err) => {
        //console.error(err);
        this.utilsSvc.presentToast({
          message: 'Error al eliminar imagen',
          duration: 1500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline'
        });
      },
      complete: () => {
        loading.dismiss();
      }
    });
  }


  filterProducts() {
    if (this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.products = this.originalProducts.filter(product => {
        const matchesName = product.name.toLowerCase().includes(searchTermLower);
        const matchesCategory = product.categoriaProducto.toLowerCase().includes(searchTermLower);
        return matchesName || matchesCategory;
      });
    } else {
      this.products = [...this.originalProducts]; // Restablece la lista de productos a la original si la búsqueda está vacía
    }
  }
}
