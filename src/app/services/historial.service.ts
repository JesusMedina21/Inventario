import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';  // <-- usar compat

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  historialCollection: any;

  constructor(private firestore: AngularFirestore, private afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.historialCollection = this.firestore.collection(`usuarios/${user.uid}/historial`);
      }
    });
  }

  agregarRegistro(registro: any) {
    return this.historialCollection.add(registro);
  }

  obtenerHistorial() {
    return this.historialCollection.valueChanges({ idField: 'id' });
  }
}
