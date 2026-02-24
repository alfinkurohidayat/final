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

// ==============================
// 🔗 Koneksi MongoDB
// ==============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB terhubung"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ==============================
// 📦 Schema
// ==============================
const mediaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["video", "audio"],
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    kelas: {
      type: String,
      required: true,
    },

    submateri: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Media = mongoose.model("Media", mediaSchema);

// ==============================
// ⚙️ Middleware
// ==============================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Render / HTTPS FIX
app.set("trust proxy", 1);

// ==============================
// 🔐 Session
// ==============================

app.use(
  session({
    name: "connect.sid",

    secret: process.env.SESSION_SECRET || "super-secret",

    resave: false,

    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),

    cookie: {
      httpOnly: true,

      secure: true,

      sameSite: "none",

      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

// ==============================
// 🔐 Auth Middleware
// ==============================

function checkAuth(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  }
}

// ==============================
// 📂 Setup Upload
// ==============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
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
// 🔑 LOGIN
// ==============================

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.isAdmin = true;

    return res.json({
      success: true,
      message: "Login berhasil",
    });
  }

  res.status(401).json({
    success: false,
    message: "Username atau password salah",
  });
});

// ==============================
// 🔍 CHECK LOGIN
// ==============================

app.get("/check-login", (req, res) => {
  res.json({
    loggedIn: !!req.session.isAdmin,
  });
});

// ==============================
// 🚪 LOGOUT
// ==============================

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");

    res.json({
      success: true,
    });
  });
});

// ==============================
// 📥 GET ALL MEDIA
// ==============================

app.get("/api/media", async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });

    res.json(media);
  } catch {
    res.status(500).json({
      success: false,
    });
  }
});

// ==============================
// 📥 GET MEDIA BY CLASS
// ==============================

app.get("/api/media/:kelas/:submateri", async (req, res) => {
  try {
    const { kelas, submateri } = req.params;

    const media = await Media.find({
      kelas,
      submateri,
    });

    res.json(media);
  } catch {
    res.status(500).json({
      success: false,
    });
  }
});

// ==============================
// ➕ ADD MEDIA
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
          message: "File tidak ada",
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
    } catch {
      res.status(500).json({
        success: false,
      });
    }
  },
);

// ==============================
// ✏️ UPDATE MEDIA
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
        // delete old file
        if (media.url) {
          const oldPath = path.join(__dirname, media.url);

          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
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
// ❌ DELETE MEDIA
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
// 🚀 START SERVER
// ==============================

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
