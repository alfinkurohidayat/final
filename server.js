import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==============================
// IMPORTANT FOR RENDER
// ==============================

app.set("trust proxy", 1);

// ==============================
// CORS FIX (WAJIB UNTUK RENDER)
// ==============================

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

// ==============================
// BODY PARSER
// ==============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// STATIC
// ==============================

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==============================
// CONNECT MONGODB
// ==============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ==============================
// SESSION (FULL FIX RENDER)
// ==============================

app.use(
  session({
    name: "connect.sid",

    secret: process.env.SESSION_SECRET || "super-secret",

    resave: false,

    saveUninitialized: false,

    proxy: true,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 60 * 60 * 24,
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
// SCHEMA
// ==============================

// const mediaSchema = new mongoose.Schema(
//   {
//     title: String,
//     type: String,
//     url: String,
//     kelas: String,
//     submateri: String,
//   },
//   { timestamps: true },
// );

const mediaSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    url: String,
    kelas: String,
    submateri: String,

    // 🔥 TAMBAHAN
    overlayType: {
      type: String,
      default: null,
    },
    overlayUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const Media = mongoose.model("Media", mediaSchema);

// ==============================
// AUTH MIDDLEWARE
// ==============================

function checkAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.status(401).json({
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
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const clean = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + clean);
  },
});

const upload = multer({ storage });

// ==============================
// LOGIN (FULL FIX)
// ==============================
upload.single("mediaFile");
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regenerate error:", err);

        return res.status(500).json({
          success: false,
          message: "Session error",
        });
      }

      req.session.isAdmin = true;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }

        return res.json({
          success: true,
          message: "Login berhasil",
        });
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
    loggedIn: req.session?.isAdmin || false,
  });
});

// ==============================
// LOGOUT (FULL FIX)
// ==============================

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
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
  upload.fields([
    { name: "mediaFile", maxCount: 1 },
    { name: "overlayFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files?.mediaFile) {
        return res.status(400).json({
          success: false,
          message: "File tidak ada",
        });
      }

      const mainFile = req.files.mediaFile[0];
      const overlayFile = req.files.overlayFile?.[0];

      const media = await Media.create({
        title: req.body.title,
        type: req.body.type,
        kelas: req.body.kelas,
        submateri: req.body.submateri,
        url: "/uploads/" + mainFile.filename,

        // 🔥 SIMPAN OVERLAY
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
// ERROR HANDLER
// ==============================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    error: err.message,
  });
});

// ==============================
// START SERVER
// ==============================

const PORT = process.env.PORT || 5001;

// CONNECT DB DULU BARU START SERVER
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);

    // hentikan app jika DB gagal
    process.exit(1);
  }
}

startServer();
//
//

// import express from "express";
// import mongoose from "mongoose";
// import session from "express-session";
// import MongoStore from "connect-mongo";
// import dotenv from "dotenv";
// import multer from "multer";
// import fs from "fs";
// import path from "path";
// import cors from "cors";
// import { fileURLToPath } from "url";

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// // ==============================
// // IMPORTANT FOR RENDER
// // ==============================
// app.set("trust proxy", 1);

// // ==============================
// // CORS FIX (WAJIB UNTUK RENDER)
// // ==============================
// app.use(
//   cors({
//     origin: [
//       "https://final-9pgj.onrender.com",
//       "https://final-o4p6.onrender.com",
//       "http://localhost:3000",
//       "http://localhost:5000",
//     ],
//     credentials: true,
//   }),
// );

// // ==============================
// // BODY PARSER
// // ==============================
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ==============================
// // STATIC
// // ==============================
// app.use(express.static(path.join(__dirname, "public")));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // ==============================
// // CONNECT MONGODB
// // ==============================
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ MongoDB error:", err));

// // ==============================
// // SESSION (FULL FIX RENDER + ROLLING)
// // ==============================
// app.use(
//   session({
//     name: "connect.sid",
//     secret: process.env.SESSION_SECRET || "super-secret",
//     resave: false,
//     saveUninitialized: false,
//     proxy: true,
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGO_URI,
//       ttl: 60 * 60 * 24 * 7, // 7 hari agar session tidak cepat hilang
//     }),
//     cookie: {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // auto secure di prod, false di dev
//       sameSite: "none",
//       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 hari
//     },
//     rolling: true, // 🔥 refresh maxAge setiap request
//   }),
// );

// // ==============================
// // SCHEMA
// // ==============================
// const mediaSchema = new mongoose.Schema(
//   {
//     title: String,
//     type: String,
//     url: String,
//     kelas: String,
//     submateri: String,
//     overlayType: { type: String, default: null },
//     overlayUrl: { type: String, default: null },
//   },
//   { timestamps: true },
// );

// const Media = mongoose.model("Media", mediaSchema);

// // ==============================
// // AUTH MIDDLEWARE
// // ==============================
// function checkAuth(req, res, next) {
//   if (req.session && req.session.isAdmin) return next();
//   return res.status(401).json({ success: false, message: "Unauthorized" });
// }

// // ==============================
// // UPLOAD CONFIG
// // ==============================
// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const clean = file.originalname.replace(/\s+/g, "_");
//     cb(null, Date.now() + "-" + clean);
//   },
// });
// const upload = multer({ storage });

// // ==============================
// // LOGIN
// // ==============================
// app.post("/login", upload.single("mediaFile"), (req, res) => {
//   const { username, password } = req.body;
//   if (
//     username === process.env.ADMIN_USER &&
//     password === process.env.ADMIN_PASS
//   ) {
//     req.session.regenerate((err) => {
//       if (err) {
//         console.error("Session regenerate error:", err);
//         return res
//           .status(500)
//           .json({ success: false, message: "Session error" });
//       }
//       req.session.isAdmin = true;
//       req.session.save((err) => {
//         if (err) console.error("Session save error:", err);
//         return res.json({ success: true, message: "Login berhasil" });
//       });
//     });
//   } else {
//     res
//       .status(401)
//       .json({ success: false, message: "Username atau password salah" });
//   }
// });

// // ==============================
// // CHECK LOGIN
// // ==============================
// app.get("/check-login", (req, res) => {
//   res.json({ loggedIn: req.session?.isAdmin || false });
// });

// // ==============================
// // LOGOUT
// // ==============================
// app.post("/logout", (req, res) => {
//   req.session.destroy(() => {
//     res.clearCookie("connect.sid", {
//       path: "/",
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "none",
//     });
//     res.json({ success: true });
//   });
// });

// // ==============================
// // CRUD MEDIA
// // ==============================
// app.get("/api/media", async (req, res) => {
//   try {
//     const media = await Media.find().sort({ createdAt: -1 });
//     res.json(media);
//   } catch (err) {
//     res.status(500).json({ success: false });
//   }
// });

// app.get("/api/media/:kelas/:submateri", async (req, res) => {
//   try {
//     const media = await Media.find({
//       kelas: req.params.kelas,
//       submateri: req.params.submateri,
//     });
//     res.json(media);
//   } catch {
//     res.status(500).json({ success: false });
//   }
// });

// app.post(
//   "/api/media",
//   checkAuth,
//   upload.fields([
//     { name: "mediaFile", maxCount: 1 },
//     { name: "overlayFile", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       if (!req.files?.mediaFile)
//         return res
//           .status(400)
//           .json({ success: false, message: "File tidak ada" });

//       const mainFile = req.files.mediaFile[0];
//       const overlayFile = req.files.overlayFile?.[0];

//       const media = await Media.create({
//         title: req.body.title,
//         type: req.body.type,
//         kelas: req.body.kelas,
//         submateri: req.body.submateri,
//         url: "/uploads/" + mainFile.filename,
//         overlayType: overlayFile ? req.body.overlayType : null,
//         overlayUrl: overlayFile ? "/uploads/" + overlayFile.filename : null,
//       });

//       res.json({ success: true, data: media });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ success: false });
//     }
//   },
// );

// app.put(
//   "/api/media/:id",
//   checkAuth,
//   upload.single("mediaFile"),
//   async (req, res) => {
//     try {
//       const media = await Media.findById(req.params.id);
//       if (!media) return res.status(404).json({ success: false });

//       media.title = req.body.title;
//       media.type = req.body.type;
//       media.kelas = req.body.kelas;
//       media.submateri = req.body.submateri;

//       if (req.file) {
//         if (media.url) {
//           const oldFile = path.join(__dirname, media.url);
//           if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
//         }
//         media.url = "/uploads/" + req.file.filename;
//       }

//       await media.save();
//       res.json({ success: true, data: media });
//     } catch {
//       res.status(500).json({ success: false });
//     }
//   },
// );

// app.delete("/api/media/:id", checkAuth, async (req, res) => {
//   try {
//     const media = await Media.findById(req.params.id);
//     if (!media) return res.status(404).json({ success: false });

//     if (media.url) {
//       const filePath = path.join(__dirname, media.url);
//       if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//     }

//     await media.deleteOne();
//     res.json({ success: true });
//   } catch {
//     res.status(500).json({ success: false });
//   }
// });

// // ==============================
// // ERROR HANDLER
// // ==============================
// app.use((err, req, res, next) => {
//   console.error("SERVER ERROR:", err);
//   res.status(500).json({ success: false, error: err.message });
// });

// // ==============================
// // START SERVER
// // ==============================
// const PORT = process.env.PORT || 5001;

// async function startServer() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 30000,
//     });
//     console.log("✅ MongoDB connected");

//     app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//   } catch (err) {
//     console.error("❌ MongoDB connection failed:", err);
//     process.exit(1);
//   }
// }

// startServer();
