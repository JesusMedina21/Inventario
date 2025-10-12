export interface User{
    uid: string,
    email: string,
    password: string,
    name: string,
    image?: string;
    token?: string; // opcional, para manejar el auth
    image_public_id?: string; // ID de Cloudinary para eliminar la imagen

}