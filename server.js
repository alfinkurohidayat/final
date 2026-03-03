import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// CONNECT DATABASE
// ==============================
mongoose.connect(process.env.MONGO_URI);

// ==============================
// SESSION
// ==============================
app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
  }),
);

// ==============================
// AUTH MIDDLEWARE
// ==============================
function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false });
  }
  next();
}

// ==============================
// STORAGE MODE SWITCH
// ==============================
const useCloudinary = process.env.USE_CLOUDINARY === "true";

let upload;

// ==============================
// CLOUDINARY MODE
// ==============================
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async () => ({
      folder: "media-app",
      resource_type: "auto",
    }),
  });

  upload = multer({ storage });

  console.log("🚀 Running in CLOUDINARY MODE");
} else {
  // ==============================
  // LOCAL MODE (RENDER SAFE)
  // ==============================
  const uploadPath = path.join(process.cwd(), "uploads");

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  app.use("/uploads", express.static(uploadPath));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  upload = multer({ storage });

  console.log("📁 Running in LOCAL MODE");
}

// ==============================
// MONGOOSE SCHEMA
// ==============================
const MediaSchema = new mongoose.Schema({
  title: String,
  type: String,
  kelas: String,
  submateri: String,
  url: String,
  overlayType: { type: String, default: null },
  overlayUrl: { type: String, default: null },
});

const Media = mongoose.model("Media", MediaSchema);

// ==============================
// HELPER DELETE CLOUDINARY
// ==============================
async function deleteFromCloudinary(fileUrl) {
  if (!fileUrl || !useCloudinary) return;

  try {
    const parts = fileUrl.split("/");
    const fileName = parts[parts.length - 1];
    const publicId = "media-app/" + fileName.split(".")[0];

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });
  } catch (err) {
    console.log("Cloudinary delete error:", err.message);
  }
}

// ==============================
// GET ALL MEDIA
// ==============================
app.get("/api/media", async (req, res) => {
  const data = await Media.find();
  res.json({ success: true, data });
});

// ==============================
// CREATE MEDIA
// ==============================
app.post(
  "/api/media",
  checkAuth,
  upload.fields([
    { name: "mediaFile", maxCount: 1 },
    { name: "overlayFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files?.mediaFile)
        return res.status(400).json({
          success: false,
          message: "File utama tidak ada",
        });

      const mainFile = req.files.mediaFile[0];
      const overlayFile = req.files.overlayFile?.[0];

      const media = await Media.create({
        title: req.body.title,
        type: req.body.type,
        kelas: req.body.kelas,
        submateri: req.body.submateri,
        url: useCloudinary ? mainFile.path : "/uploads/" + mainFile.filename,
        overlayType: overlayFile ? req.body.overlayType : null,
        overlayUrl: overlayFile
          ? useCloudinary
            ? overlayFile.path
            : "/uploads/" + overlayFile.filename
          : null,
      });

      res.json({ success: true, data: media });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },
);

// ==============================
// UPDATE MEDIA
// ==============================
app.put(
  "/api/media/:id",
  checkAuth,
  upload.fields([
    { name: "mediaFile", maxCount: 1 },
    { name: "overlayFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const media = await Media.findById(req.params.id);
      if (!media) return res.status(404).json({ success: false });

      media.title = req.body.title;
      media.type = req.body.type;
      media.kelas = req.body.kelas;
      media.submateri = req.body.submateri;

      // MAIN FILE
      if (req.files?.mediaFile) {
        if (useCloudinary) {
          await deleteFromCloudinary(media.url);
          media.url = req.files.mediaFile[0].path;
        } else {
          if (media.url) {
            const old = path.join(process.cwd(), media.url);
            if (fs.existsSync(old)) fs.unlinkSync(old);
          }
          media.url = "/uploads/" + req.files.mediaFile[0].filename;
        }
      }

      // OVERLAY
      if (req.files?.overlayFile) {
        if (useCloudinary) {
          await deleteFromCloudinary(media.overlayUrl);
          media.overlayUrl = req.files.overlayFile[0].path;
        } else {
          if (media.overlayUrl) {
            const old = path.join(process.cwd(), media.overlayUrl);
            if (fs.existsSync(old)) fs.unlinkSync(old);
          }
          media.overlayUrl = "/uploads/" + req.files.overlayFile[0].filename;
        }
        media.overlayType = req.body.overlayType;
      }

      await media.save();
      res.json({ success: true, data: media });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },
);

// ==============================
// DELETE MEDIA
// ==============================
app.delete("/api/media/:id", checkAuth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false });

    if (useCloudinary) {
      await deleteFromCloudinary(media.url);
      await deleteFromCloudinary(media.overlayUrl);
    } else {
      if (media.url) {
        const filePath = path.join(process.cwd(), media.url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      if (media.overlayUrl) {
        const overlayPath = path.join(process.cwd(), media.overlayUrl);
        if (fs.existsSync(overlayPath)) fs.unlinkSync(overlayPath);
      }
    }

    await media.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ==============================
app.listen(process.env.PORT || 5000, () => console.log("Server running..."));
app.use(express.static("public"));
