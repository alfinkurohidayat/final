import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
// STATIC UPLOADS
// ==============================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
// MULTER CONFIG
// ==============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ==============================
// MONGOOSE SCHEMA
// ==============================
const MediaSchema = new mongoose.Schema({
  title: String,
  type: String,
  kelas: String,
  submateri: String,
  url: String,
  overlayType: {
    type: String,
    default: null,
  },
  overlayUrl: {
    type: String,
    default: null,
  },
});

const Media = mongoose.model("Media", MediaSchema);

// ==============================
// GET ALL MEDIA
// ==============================
app.get("/api/media", async (req, res) => {
  const data = await Media.find();
  res.json({ success: true, data });
});

// ==============================
// CREATE MEDIA (SUPPORT OVERLAY)
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
        url: "/uploads/" + mainFile.filename,
        overlayType: overlayFile ? req.body.overlayType : null,
        overlayUrl: overlayFile ? "/uploads/" + overlayFile.filename : null,
      });

      res.json({
        success: true,
        data: media,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },
);

// ==============================
// UPDATE MEDIA (SUPPORT OVERLAY)
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

      // UPDATE FILE UTAMA
      if (req.files?.mediaFile) {
        if (media.url) {
          const oldMain = path.join(__dirname, media.url);
          if (fs.existsSync(oldMain)) fs.unlinkSync(oldMain);
        }

        media.url = "/uploads/" + req.files.mediaFile[0].filename;
      }

      // UPDATE OVERLAY
      if (req.files?.overlayFile) {
        if (media.overlayUrl) {
          const oldOverlay = path.join(__dirname, media.overlayUrl);
          if (fs.existsSync(oldOverlay)) fs.unlinkSync(oldOverlay);
        }

        media.overlayType = req.body.overlayType;
        media.overlayUrl = "/uploads/" + req.files.overlayFile[0].filename;
      }

      await media.save();

      res.json({
        success: true,
        data: media,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },
);

// ==============================
// DELETE MEDIA (HAPUS SEMUA FILE)
// ==============================
app.delete("/api/media/:id", checkAuth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) return res.status(404).json({ success: false });

    // hapus file utama
    if (media.url) {
      const filePath = path.join(__dirname, media.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // hapus overlay
    if (media.overlayUrl) {
      const overlayPath = path.join(__dirname, media.overlayUrl);
      if (fs.existsSync(overlayPath)) fs.unlinkSync(overlayPath);
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
