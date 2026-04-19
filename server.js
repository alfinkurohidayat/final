import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "https://final-9pgj.onrender.com",
      "https://final-o4p6.onrender.com",
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    rolling: true,
  }),
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "djndmhjih",
  api_key: process.env.CLOUDINARY_API_KEY || "GWt0Ro8e9SDD7V5VJB8y8LGR8do",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const mediaSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    url: String,
    kelas: String,
    submateri: String,
    overlayType: { type: String, default: null },
    overlayUrl: { type: String, default: null },
  },
  { timestamps: true },
);

const Media = mongoose.model("Media", mediaSchema);

function checkAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ success: false, message: "Unauthorized" });
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ success: false });
      req.session.isAdmin = true;
      res.json({ success: true });
    });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get("/check-login", (req, res) => {
  res.json({ loggedIn: req.session?.isAdmin || false });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/media", async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/media/:kelas/:submateri", async (req, res) => {
  try {
    const media = await Media.find({
      kelas: req.params.kelas,
      submateri: req.params.submateri,
    });
    res.json(media);
  } catch {
    res.status(500).json({ success: false });
  }
});

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
        return res
          .status(400)
          .json({ success: false, message: "File tidak ada" });

      const mainFile = req.files.mediaFile[0];
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: "auto", folder: "e-learning" },
            (error, result) => (error ? reject(error) : resolve(result)),
          )
          .end(mainFile.buffer);
      });

      let overlayResult = null;
      if (req.files.overlayFile) {
        overlayResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { resource_type: "auto", folder: "e-learning" },
              (error, result) => (error ? reject(error) : resolve(result)),
            )
            .end(req.files.overlayFile[0].buffer);
        });
      }

      const media = await Media.create({
        title: req.body.title,
        type: req.body.type,
        kelas: req.body.kelas,
        submateri: req.body.submateri,
        url: result.secure_url,
        overlayType: req.body.overlayType || null,
        overlayUrl: overlayResult ? overlayResult.secure_url : null,
      });

      res.json({ success: true, data: media });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },
);

app.put(
  "/api/media/:id",
  checkAuth,
  upload.single("mediaFile"),
  async (req, res) => {
    try {
      const media = await Media.findById(req.params.id);
      if (!media) return res.status(404).json({ success: false });

      media.title = req.body.title;
      media.type = req.body.type;
      media.kelas = req.body.kelas;
      media.submateri = req.body.submateri;

      if (req.file) {
        // Hapus lama
        if (media.url) {
          const publicId = media.url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
        // Upload baru
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { resource_type: "auto", folder: "e-learning" },
              (error, result) => (error ? reject(error) : resolve(result)),
            )
            .end(req.file.buffer);
        });
        media.url = result.secure_url;
      }

      await media.save();
      res.json({ success: true, data: media });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },
);

app.delete("/api/media/:id", checkAuth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false });

    if (media.url) {
      const publicId = media.url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    if (media.overlayUrl) {
      const publicIdOverlay = media.overlayUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicIdOverlay);
    }

    await media.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5001;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  })
  .catch((err) => console.error("DB error:", err));
