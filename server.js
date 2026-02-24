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

// ==============================
// PATH SETUP
// ==============================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==============================
// CONNECT MONGODB
// ==============================

mongoose
  .connect(process.env.MONGO_URI, {
    autoIndex: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ==============================
// SCHEMA
// ==============================

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    type: {
      type: String,
      enum: ["video", "audio"],
      required: true,
    },

    url: { type: String, required: true },

    kelas: { type: String, required: true },

    submateri: { type: String, required: true },
  },
  { timestamps: true },
);

const Media = mongoose.model("Media", mediaSchema);

// ==============================
// MIDDLEWARE
// ==============================

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// IMPORTANT FOR RENDER
app.set("trust proxy", 1);

// ==============================
// SESSION CONFIG (FIX LOGIN ERROR)
// ==============================

app.use(
  session({
    name: "connect.sid",

    secret: process.env.SESSION_SECRET || "super-secret-key",

    resave: false,

    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),

    cookie: {
      httpOnly: true,

      secure: true, // required for Render HTTPS

      sameSite: "none",

      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);

// ==============================
// AUTH MIDDLEWARE
// ==============================

function checkAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  res.status(401).json({
    success: false,
    message: "Unauthorized",
  });
}

// ==============================
// UPLOAD CONFIG
// ==============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, "_");

    cb(null, Date.now() + "-" + cleanName);
  },
});

const upload = multer({ storage });

// ==============================
// LOGIN (FIX LOGIN BERULANG)
// ==============================

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    // regenerate session FIX ERROR LOGIN KEDUA
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regenerate error:", err);

        return res.status(500).json({
          success: false,
          message: "Session error",
        });
      }

      req.session.isAdmin = true;

      res.json({
        success: true,
        message: "Login berhasil",
      });
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Username atau password salah",
    });
  }
});

// ==============================
// CHECK LOGIN
// ==============================

app.get("/check-login", (req, res) => {
  res.json({
    loggedIn: !!req.session.isAdmin,
  });
});

// ==============================
// LOGOUT (FIX COOKIE CLEAR)
// ==============================

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);

      return res.status(500).json({
        success: false,
      });
    }

    res.clearCookie("connect.sid", {
      path: "/",
      secure: true,
      sameSite: "none",
    });

    res.json({
      success: true,
    });
  });
});

// ==============================
// GET ALL MEDIA
// ==============================

app.get("/api/media", async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });

    res.json(media);
  } catch (err) {
    res.status(500).json({
      success: false,
    });
  }
});

// ==============================
// GET MEDIA BY CLASS
// ==============================

app.get("/api/media/:kelas/:submateri", async (req, res) => {
  try {
    const media = await Media.find({
      kelas: req.params.kelas,
      submateri: req.params.submateri,
    });

    res.json(media);
  } catch {
    res.status(500).json({
      success: false,
    });
  }
});

// ==============================
// ADD MEDIA
// ==============================

app.post(
  "/api/media",
  checkAuth,
  upload.single("mediaFile"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({
          success: false,
          message: "File tidak ditemukan",
        });

      const media = new Media({
        title: req.body.title,

        type: req.body.type,

        kelas: req.body.kelas,

        submateri: req.body.submateri,

        url: "/uploads/" + req.file.filename,
      });

      await media.save();

      res.json({
        success: true,
        data: media,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
      });
    }
  },
);

// ==============================
// UPDATE MEDIA
// ==============================

app.put(
  "/api/media/:id",
  checkAuth,
  upload.single("mediaFile"),
  async (req, res) => {
    try {
      const media = await Media.findById(req.params.id);

      if (!media)
        return res.status(404).json({
          success: false,
        });

      media.title = req.body.title;
      media.type = req.body.type;
      media.kelas = req.body.kelas;
      media.submateri = req.body.submateri;

      if (req.file) {
        if (media.url) {
          const oldFile = path.join(__dirname, media.url);

          if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }

        media.url = "/uploads/" + req.file.filename;
      }

      await media.save();

      res.json({
        success: true,
        data: media,
      });
    } catch {
      res.status(500).json({
        success: false,
      });
    }
  },
);

// ==============================
// DELETE MEDIA
// ==============================

app.delete("/api/media/:id", checkAuth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media)
      return res.status(404).json({
        success: false,
      });

    if (media.url) {
      const filePath = path.join(__dirname, media.url);

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await media.deleteOne();

    res.json({
      success: true,
    });
  } catch {
    res.status(500).json({
      success: false,
    });
  }
});

// ==============================
// START SERVER
// ==============================

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
