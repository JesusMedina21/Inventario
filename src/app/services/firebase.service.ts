import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, getDoc, addDoc, collection, collectionData, query, updateDoc, deleteDoc, where, getDocs } from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { getStorage, uploadString, ref, getDownloadURL, deleteObject } from 'firebase/storage';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  async getCurrentUser() {
    return await this.auth.currentUser;
  }
  getAuth() {
    return getAuth();
  }
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private utilsSvc: UtilsService) { }

  //--------------------------Cerrar sesion--------------------
  // En el método signOut
  signOut() {
    getAuth().signOut().then(() => {
      localStorage.removeItem('user');
      // Emitir evento para notificar el cambio de autenticación
      window.dispatchEvent(new Event('userAuthStateChanged'));
      this.utilsSvc.routerLink('/');
    }).catch(error => {
      //console.error('Error al cerrar sesión:', error);
    });
  }


  getAllCategorias() {
    return this.firestore.collection('categoria').valueChanges();
  }
  //--------------------------Autenticacion--------------------
  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }
  //Crear usuario
  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }
  // -------------------------------Actualizar usuario-------------
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName })
  }
  // -------------------------------Enviar email para restablecer contraseña-------------
  sendRecoveryEmail(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  // -------------------------------Base de datos-------------
  // -------------------------------Obtener documentos de una coleccion-------------

  getCollectionData(path: string, collectionQuery?: any) {
    const ref = collection(getFirestore(), path);
    return collectionData(query(ref, ...collectionQuery), { idField: 'id' });
  }
  // -------------------------------Setear un documento-------------
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }
  // -------------------------------Actualizar un documento-------------
  updateDocument(path: string, data: any) {
    return updateDoc(doc(getFirestore(), path), data);
  }
  // ------------------------------Eliminar un documento-------------
  deleteDocument(path: string) {
    return deleteDoc(doc(getFirestore(), path));
  }
  // -------------------------------Obtener documento------------- 
  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }
  // -------------------------------Agregar documento------------- 
  addDocument(path: string, data: any) {
    return addDoc(collection(getFirestore(), path), data);
  }
  // -------------------------------Almacenamiento------------- 
  //----Subir imagen
  async uploadImage(path: string, data_url: string) {
    return uploadString(ref(getStorage(), path), data_url, 'data_url').then(() => {
      return getDownloadURL(ref(getStorage(), path))
    })
  }
  // Obtener ruta de la imagen con su url
  async getFilePath(url: string) {
    return ref(getStorage(), url).fullPath
  }
  deleteFile(path: string) {
    return deleteObject(ref(getStorage(), path));
  }

  // En tu servicio FirebaseService
  async getDocumentByField(collectionPath: string, fieldName: string, value: any) {
    const collectionRef = collection(getFirestore(), collectionPath);
    const queryRef = query(collectionRef, where(fieldName, '==', value));
    const querySnapshot = await getDocs(queryRef);

    if (!querySnapshot.empty) {
      // Devuelve el primer documento encontrado
      return querySnapshot.docs[0].data();
    } else {
      // No se encontró ningún documento con el campo específico
      return null;
    }
  }
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(getFirestore(), 'usuarios');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty;
    } catch (error) {
      //console.error('Error checking email:', error);
      return false;
    }
  }

}
