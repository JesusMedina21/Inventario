import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore'; // Asegúrate de importar AngularFirestore correctamente

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  constructor(private db: AngularFirestore) { }

  async nombreExiste(nombre: string): Promise<boolean> {
    const snapshot = await this.db.collection('categorias', ref => ref.where('nombre', '==', nombre)).get().toPromise();
    return !snapshot.empty;
  }
}
