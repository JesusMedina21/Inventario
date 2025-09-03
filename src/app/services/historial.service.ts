import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  historial: any[] = [];
  historialCollection: any;


  constructor(private firestore: AngularFirestore) {
    this.historialCollection = this.firestore.collection('historial');
    this.ordenarHistorial(); // Llama a la función para ordenar el historial al inicializar el servicio
  }

  agregarRegistro(registro: any) {
    this.historialCollection.add(registro);
    this.ordenarHistorial();
  }

  obtenerHistorial() {
    return this.historial;
  }

  private ordenarHistorial() {
    this.historial.sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

}