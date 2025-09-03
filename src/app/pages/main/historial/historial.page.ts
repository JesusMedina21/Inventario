import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { Historial } from 'src/app/models/historial.model';
import { Product } from 'src/app/models/product.model';
import { DatePipe } from '@angular/common'; // Import DatePipe
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { AngularFireAuth } from '@angular/fire/compat/auth';

pdfMake.vfs = pdfFonts;

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {
  selectedButton: string
  BotonTotal: string = 'Total'
  BotonEntrada: string = 'Entrada'
  BotonSalida: string = 'Salida'
  historiales: Observable<Historial[]>;
  products: Product[] = [];
  filtroTipo: string = 'Total'; // New property to st
  noResultados: boolean = false;
  searchTerm: string = '';
  visible = false;
  pdfObject: any;
  productoSeleccionado: Product | null = null;
  busquedaPorFecha: boolean = false; // Calendario
  startDate: Date | null = null; // Variable para la fecha de inicio
  endDate: Date | null = null; // Variable para la fecha de fin
  showPdfButtons: boolean = true; // Variable para controlar la visibilidad de los botones PDF
  uid: string | null = null; // <-- Aquí guardamos el uid globalmente
  userName: string = '';

  constructor(
    private firestore: AngularFirestore,
    private datePipe: DatePipe,
    private angularAuth: AngularFireAuth

  ) { }
  historialesSubject: BehaviorSubject<Historial[]> = new BehaviorSubject([]);
  // Agrega esta función para formatear la fecha en español
  private formatFechaEspanol(fecha: Date): string {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();

    return `${dia} de ${mes} del ${anio}`;
  }
  async generarPdfPorFechas() {
    if (!this.startDate || !this.endDate) {
      alert('Por favor selecciona un rango de fechas.');
      return;
    }

    const startOfDay = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
    const endOfDay = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() + 1);

    // Obtener fecha actual para el PDF
    const fechaGeneracion = this.formatFechaEspanol(new Date());

    let docDefinition = {
      content: [],
      header: {
        margin: [0, 10, 0, 0],
        text: {
          text: `Historial del Inventario de ${this.userName}\nGenerado el: ${fechaGeneracion}`,
          alignment: 'center'
        },
      },

      footer: function (currentPage, pageCount) {
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
        header: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 10],
          color: 'white',
          alignment: 'center'
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'white',
          fillColor: '#217283',
          alignment: 'center'
        },
        tableExample: {
          margin: [0, 5, 0, 15]
        }
      },
    };

    const historiales = this.historialesSubject.getValue();
    const filteredHistoriales = historiales.filter(historial => {
      const fecha = new Date(historial.fecha.seconds * 1000);
      return fecha >= startOfDay && fecha < endOfDay;
    });

    const maxProductsPerPage = 11;
    for (let i = 0; i < filteredHistoriales.length; i += maxProductsPerPage) {
      const chunk = filteredHistoriales.slice(i, i + maxProductsPerPage);
      const rows = [];
      rows.push([
        { text: 'Producto', style: 'tableHeader' },
        { text: 'Accion', style: 'tableHeader' },
        { text: 'Cantidad', style: 'tableHeader' },
        { text: 'Fecha', style: 'tableHeader' },
      ]);
      chunk.forEach(historial => {
        const quantity = historial.tipo === 'Entrada' ? historial.cantidadAgregada : historial.cantidadSaliente;
        let displayText = '';

        if (historial.producto.Peso) {
          displayText = `${historial.producto.Peso} gramos`; // Mostrar peso si existe
        } else {
          displayText = `${quantity} Unidades`; // Mostrar cantidad si no existe peso
        }

        rows.push([
          { text: historial.producto.name, margin: [0, 10, 0, 5] },
          { text: historial.tipo, margin: [0, 10, 0, 5] },
          {
            text: displayText, // Mostrar peso o cantidad
            margin: [0, 10, 0, 5]
          },
          { text: this.formatDate(historial.fecha), margin: [0, 10, 0, 5] },
        ]);
      });
      docDefinition.content.push({
        table: {
          widths: ['*', '*', '*', '*'],
          body: rows
        }
      });
      if (i + maxProductsPerPage < filteredHistoriales.length) {
        docDefinition.content.push({ text: '', pageBreak: 'after' });
      }
    }

    if (filteredHistoriales.length === 0) {
      docDefinition.content.push({ text: 'No se encontraron historiales en el rango de fechas seleccionado.', margin: [0, 20, 0, 20] });
    }

    const pdfDoc = pdfMake.createPdf(docDefinition);

    if (Capacitor.isNativePlatform()) {
      // Para dispositivos móviles - generar y abrir automáticamente
      pdfDoc.getBlob(async (blob) => {
        try {
          const base64 = await this.blobToBase64(blob);
          const fechaInicio = this.startDate.toISOString().split('T')[0];
          const fechaFin = this.endDate.toISOString().split('T')[0];
          const fileName = `historial_${fechaInicio}_to_${fechaFin}_${new Date().getTime()}.pdf`;

          // Guardar el archivo temporalmente en cache
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache, // Usar cache para archivos temporales
            recursive: true
          });

          // Obtener la URI del archivo
          const fileUri = await Filesystem.getUri({
            directory: Directory.Cache,
            path: fileName
          });

          // Abrir el PDF automáticamente con aplicaciones disponibles
          await Share.share({
            title: `Historial del ${fechaInicio} al ${fechaFin}`,
            text: `Historial del  ${fechaInicio} al ${fechaFin}`,
            url: fileUri.uri,
            dialogTitle: 'Abrir PDF con'
          });

        } catch (error) {
          //console.error('Error al generar/compartir PDF:', error);
          alert('Error al abrir el PDF: ' + error.message);
        }
      });
    } else {
      // Para navegador web - descarga normal
      const fechaInicio = this.startDate.toISOString().split('T')[0];
      const fechaFin = this.endDate.toISOString().split('T')[0];
      pdfDoc.download(`historial_${fechaInicio}_to_${fechaFin}.pdf`);
    }
  }

  async generarPdf(tipo: string) {
    // Obtener fecha actual para el PDF
    const fechaGeneracion = this.formatFechaEspanol(new Date());

    let docDefinition = {
      content: [],
      header: {
        margin: [0, 10, 0, 0],
        text: {
          text: `Historial del Inventario de ${this.userName}\nGenerado el: ${fechaGeneracion}`,
          alignment: 'center'
        },
      },
      footer: function (currentPage, pageCount) {
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
        header: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 10],
          color: 'white',
          alignment: 'center'
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'white',
          fillColor: '#217283',
          alignment: 'center'
        },
        tableExample: {
          margin: [0, 5, 0, 15]
        }
      },
    };

    const historiales = this.historialesSubject.getValue();
    let filteredHistoriales: Historial[] = [];

    if (tipo === 'Total') {
      filteredHistoriales = historiales;
    } else {
      filteredHistoriales = historiales.filter(historial => historial.tipo === tipo);
    }

    const maxProductsPerPage = 11;
    for (let i = 0; i < filteredHistoriales.length; i += maxProductsPerPage) {
      const chunk = filteredHistoriales.slice(i, i + maxProductsPerPage);
      const rows = [];
      rows.push([
        { text: 'Producto', style: 'tableHeader' },
        { text: 'Accion', style: 'tableHeader' },
        { text: 'Cantidad', style: 'tableHeader' },
        { text: 'Fecha', style: 'tableHeader' },
      ]);

      chunk.forEach(historial => {
        const quantity = historial.tipo === 'Entrada' ? historial.cantidadAgregada : historial.cantidadSaliente;
        let displayText = '';

        if (historial.producto.Peso) {
          displayText = `${historial.producto.Peso} gramos`; // Mostrar peso si existe
        } else {
          displayText = `${quantity} Unidades`; // Mostrar cantidad si no existe peso
        }

        rows.push([
          { text: historial.producto.name, margin: [0, 10, 0, 5] },
          { text: historial.tipo, margin: [0, 10, 0, 5] },
          {
            text: displayText, // Mostrar peso o cantidad
            margin: [0, 10, 0, 5]
          },
          { text: this.formatDate(historial.fecha), margin: [0, 10, 0, 5] },
        ]);
      });

      docDefinition.content.push({
        table: {
          widths: ['*', '*', '*', '*'],
          body: rows
        }
      });

      if (i + maxProductsPerPage < filteredHistoriales.length) {
        docDefinition.content.push({ text: '', pageBreak: 'after' });
      }
    }

    const pdfDoc = pdfMake.createPdf(docDefinition);

    if (Capacitor.isNativePlatform()) {
      // Para dispositivos móviles
      pdfDoc.getBlob(async (blob) => {
        try {
          const base64 = await this.blobToBase64(blob);
          let fileName = '';

          if (tipo === 'Salida') {
            fileName = `historial_salida_${new Date().getTime()}.pdf`;
          } else if (tipo === 'Entrada') {
            fileName = `historial_entrada_${new Date().getTime()}.pdf`;
          } else if (tipo === 'Total') {
            fileName = `historial_total_${new Date().getTime()}.pdf`;
          }

          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache, // Usar cache para archivos temporales
            recursive: true
          });

          // Obtener la URI del archivo
          const fileUri = await Filesystem.getUri({
            directory: Directory.Cache,
            path: fileName
          });

          // Abrir el PDF automáticamente con aplicaciones disponibles
          await Share.share({
            title: `Historial ${tipo}`,
            text: `Historial ${tipo}`,
            url: fileUri.uri,
            dialogTitle: 'Abrir PDF con'
          });

        } catch (error) {
          //console.error('Error al guardar PDF:', error);
          alert('Error al guardar el PDF: ' + error.message);
        }
      });
    } else {
      // Para navegador web
      let fileName = '';
      if (tipo === 'Salida') {
        fileName = 'Historial de Salida.pdf';
      } else if (tipo === 'Entrada') {
        fileName = 'Historial de Entrada.pdf';
      } else if (tipo === 'Total') {
        fileName = 'Historial Total.pdf';
      }
      pdfDoc.download(fileName);
    }
  }

  // Función para obtener el texto del encabezado según el tipo
  private getHeaderText(tipo: string): string {
    if (tipo === 'Salida') {
      return 'Historial de Salida';
    } else if (tipo === 'Entrada') {
      return 'Historial de Entrada';
    } else if (tipo === 'Total') {
      return 'Historial Total';
    }
    return '';
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

  async ngOnInit() {
    this.selectedButton = 'Total';

    const user = await this.angularAuth.currentUser;
    this.uid = user?.uid ?? null;

    // Obtener el nombre del usuario
    if (user) {
      this.userName = user.displayName || user.email || 'Usuario'; // Usa displayName, email o un valor por defecto
    }

    if (!this.uid) return;

    this.historiales = this.firestore.collection<Historial>(
      `usuarios/${this.uid}/historial`,
      ref => ref.orderBy('fecha', 'desc')
    ).valueChanges();

    this.cargarHistorial();
    this.cargarProductos(this.uid);
  }


  cargarHistorial() {
    if (!this.uid) return;

    this.historiales = this.firestore.collection<Historial>(
      `usuarios/${this.uid}/historial`,
      ref => ref.orderBy('fecha', 'desc')
    ).valueChanges();

    this.historiales.subscribe(historiales => {
      this.historialesSubject.next(historiales);
      this.noResultados = historiales.length === 0;
    });
  }



  cargarProductos(uid: string) {
    this.firestore.collection<Product>(`usuarios/${uid}/productos`)
      .valueChanges()
      .subscribe(products => {
        this.products = products;
      });
  }


  //Buscador de nombres
  filtrarPorNombre() {
    if (this.searchTerm.trim() === '') {
      this.cargarHistorial(); // ✅ ya no pasamos uid
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase(); // Convertir el término de búsqueda a minúsculas

    this.historialesSubject.subscribe(historiales => {
      const filteredHistoriales = historiales.filter(historial =>
        historial.producto.name.toLowerCase().includes(searchTermLower)
      );
      this.historiales = of(filteredHistoriales); // Actualizar la lista de historiales filtrados
      this.noResultados = filteredHistoriales.length === 0;
    });
  }

  filtrarHistorialTotal() {
    this.selectedButton = 'Total';
    this.historiales = this.firestore.collection<Historial>(`usuarios/${this.uid}/historial`, ref => ref.orderBy('fecha', 'desc')).valueChanges();

    this.filtroTipo = 'Total'; // Set filtroTipo to 'Total'
    this.historiales.subscribe((historiales) => {
      if (historiales.length === 0) {
        this.noResultados = true;
      } else {
        this.noResultados = false;
      }
    });
  }

  filtrarHistorial(tipo: string) {
    this.selectedButton = tipo;
    this.filtroTipo = tipo; // Set filtroTipo to the selected type
    // Order by date in descending order
    this.historiales = this.firestore.collection<Historial>(`usuarios/${this.uid}/historial`, ref => ref.where('tipo', '==', tipo).orderBy('fecha', 'desc')).valueChanges();

    this.historiales.subscribe((historiales) => {
      if (historiales.length === 0) {
        this.noResultados = true;
      } else {
        this.noResultados = false;
      }
    });
  }

  formatDate(timestamp: any): string {
    const date = new Date(timestamp.seconds * 1000); // Convertir el timestamp a una fecha

    // Obtener los componentes de la fecha
    const dayOfWeek = this.datePipe.transform(date, 'EEEE', 'es'); // Día de la semana
    const day = this.datePipe.transform(date, 'dd', 'es'); // Día del mes
    const month = this.datePipe.transform(date, 'MM', 'es'); // Mes
    const year = this.datePipe.transform(date, 'yyyy', 'es'); // Año
    const time = this.datePipe.transform(date, 'h:mm a', 'es'); // Hora

    // Formar la cadena final
    return `${dayOfWeek} ${day}/${month} del ${year} a las ${time}`;
  }



  // Agregar una variable para controlar si se ha hecho clic en la pantalla
  // Agregar una variable para controlar si se ha hecho clic en la pantalla
  isScreenClicked = false;

  // Función para vaciar el campo de búsqueda
  vaciarCampoBuscador() {
    this.searchTerm = ''; // Vaciar el campo de búsqueda
    this.isScreenClicked = true; // Marcar que se ha hecho clic en la pantalla
  }

  // Función para buscar productos evitando reiniciar la búsqueda al hacer clic en la pantalla
  // Función para buscar productos y ordenar los resultados de más reciente a más antiguo


  ///Calendario


  toggleCalendar() {

    this.visible = !this.visible;

  }

  // Declarar una variable para controlar la visibilidad del mensaje de error
  errorNoFechas: boolean = false;
  Calendario(event) {
    const selectedDate = new Date(event.detail.value);
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);

    // Actualizar la variable busquedaPorFecha a true cuando se selecciona una fecha
    this.busquedaPorFecha = true;

    if (this.selectedButton === 'Entrada') {
      this.historiales = this.firestore.collection<Historial>(`usuarios/${this.uid}/historial`, ref =>
        ref.where('tipo', '==', 'Entrada').where('fecha', '>=', startOfDay).where('fecha', '<', endOfDay).orderBy('fecha', 'desc')
      ).valueChanges();
    } else if (this.selectedButton === 'Salida') {
      this.historiales = this.firestore.collection<Historial>(`usuarios/${this.uid}/historial`, ref =>
        ref.where('tipo', '==', 'Salida').where('fecha', '>=', startOfDay).where('fecha', '<', endOfDay).orderBy('fecha', 'desc')
      ).valueChanges();
    } else {
      this.historiales = this.firestore.collection<Historial>(`usuarios/${this.uid}/historial`, ref =>
        ref.where('fecha', '>=', startOfDay).where('fecha', '<', endOfDay).orderBy('fecha', 'desc')
      ).valueChanges();
    }

    this.historiales.subscribe((historiales) => {
      if (historiales.length === 0) {
        this.noResultados = true;
      } else {
        this.noResultados = false;
      }
    });
    this.visible = false;
  }

  onStartDateChange(event: any) {
    this.startDate = new Date(event.detail.value);
    this.filtrarPorRangoFechas();
  }

  onEndDateChange(event: any) {
    this.endDate = new Date(event.detail.value);
    this.filtrarPorRangoFechas();
  }
  filtrarPorRangoFechas() {
    if (this.startDate && this.endDate) {
      const startOfDay = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
      const endOfDay = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() + 1); // Fin del día

      // Filtrar por tipo según el botón seleccionado
      let query = this.firestore.collection<Historial>(`usuarios/${this.uid}/historial`, ref => {
        let queryRef = ref.where('fecha', '>=', startOfDay).where('fecha', '<', endOfDay);
        if (this.selectedButton === 'Entrada') {
          queryRef = queryRef.where('tipo', '==', 'Entrada');
        } else if (this.selectedButton === 'Salida') {
          queryRef = queryRef.where('tipo', '==', 'Salida');
        }
        return queryRef.orderBy('fecha', 'desc');
      });

      this.historiales = query.valueChanges();
      this.historiales.subscribe((historiales) => {
        this.noResultados = historiales.length === 0;
        this.showPdfButtons = false; // Ocultar los botones PDF existentes
      });
    } else {
      // Si no hay fechas seleccionadas, podrías cargar el historial completo o mostrar un mensaje
      this.cargarHistorial();
      this.showPdfButtons = true; // Mostrar los botones PDF existentes
    }
  }

}