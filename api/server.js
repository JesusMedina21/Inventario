const express = require("express");
const cors = require("cors");
const { v2: cloudinary } = require("cloudinary");

const app = express();
app.use(express.json());

// 👇 habilitar CORS para cualquier origen (dev)
app.use(cors({
  origin: "http://localhost:8100" // tu frontend (Ionic)
}));

// Config Cloudinary
cloudinary.config({
  cloud_name: "dq3w5v6qv",
  api_key: "241923579578178",
  api_secret: "LsgFJSnTtYVyRXdPJ8DfsKINFIM"
});


// Endpoint deleteimage
app.post("/api/deleteimage", async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ message: "Falta el publicId" });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return res.json({ message: "Imagen eliminada", result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error eliminando la imagen" });
  }
});

// Correr en localhost:3000
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
