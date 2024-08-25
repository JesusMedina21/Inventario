import { Timestamp } from "firebase/firestore";

export interface Historial{ 
    id: string, 
    fecha: Timestamp,
    cantidadAgregada: number,
    cantidadSaliente: number,
    cantidadAnterior: number,
    producto: any,
    tipo: string,
} 