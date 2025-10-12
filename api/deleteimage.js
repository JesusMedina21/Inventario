import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  //console.log("Método recibido:", req.method);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: "Falta el publicId" });
    }
    //console.log
    (
      "CLOUDINARY CONFIG:",
      {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
        api_secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING",
        publicId
      });

    const result = await cloudinary.uploader.destroy(publicId);
    return res.status(200).json({ message: "Imagen eliminada", result });
  } catch (error) {
    //console.error("Error eliminando:", error);
    return res.status(500).json({ message: "Error eliminando la imagen", error });
  }
}
