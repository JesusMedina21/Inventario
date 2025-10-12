import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

  private cloudName = environment.cloudinaryConfig.cloudName;
  private uploadPreset = environment.cloudinaryConfig.uploadPreset;
  private folder = environment.cloudinaryConfig.folder;
  private folderProfile = environment.cloudinaryConfig.folderProfile

  constructor(private http: HttpClient) { }

  /**
   * Sube una imagen a Cloudinary
   * @param file archivo en base64 o File
   */
  uploadImage(file: string | File) {
    const formData = new FormData();
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', this.folder);

    if (typeof file === 'string') {
      // Si es base64
      formData.append('file', file);
    } else {
      // Si es File (ej: input file)
      formData.append('file', file, file.name);
    }

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    return this.http.post(url, formData);
  }

  deleteImage(publicId: string) {
    return this.http.post('https://tuinventario.vercel.app/api/deleteimage', { publicId });
  }

  uploadImageProfile(file: string | File): Observable<any> {
    const formData = new FormData();
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', this.folderProfile);
    formData.append('file', file);

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    return this.http.post(url, formData).pipe(
      catchError((error) => {
        //console.error('Error al subir imagen a Cloudinary:', error);
        return throwError(() => error);
      })
    );
  }

  deleteImageProfile(publicId: string) {
    return this.http.post('https://tuinventario.vercel.app/api/deleteimage', { publicId });
  }



}
