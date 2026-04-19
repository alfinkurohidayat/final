import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: ["http://localhost:5001", "https://final-9pgj.onrender.com"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ==============================
// 🔌 DATABASE
// ==============================
mongoose.connect(
  process.env.MONGO_URI || "mongodb://localhost:27017/elearning",
);

// ==============================
// 🔐 SESSION
// ==============================
app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "super-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      httpOnly: true,
      secure: true, // ⬅️ WAJIB (Render pakai HTTPS)
      sameSite: "none", // ⬅️ INI KUNCI UTAMA (biar cookie dikirim)
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    rolling: true,
  }),
);

// ==============================
// ☁️ CLOUDINARY
// ==============================
cloudinary.config({
  cloud_name: "djndmhjih",
  api_key: "636163288134166",
  api_secret: process.env.CLOUDINARY_SECRET,
});

// ==============================
// 📦 SCHEMA MEDIA (UPDATED)
// ==============================
const mediaSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    url: String,
    kelas: String,
    submateri: String,

    overlayType: String,
    overlayUrl: String,

    // 🔥 NEW (SOAL)
    isQuestion: { type: Boolean, default: false },
    questionType: String, // "truefalse" | "essay"
    questionItems: [
      {
        question: String,
        answer: String, // untuk admin referensi
      },
    ],
  },
  { timestamps: true },
);

const Media = mongoose.model("Media", mediaSchema);

// ==============================
// 📦 SCHEMA JAWABAN SISWA
// ==============================
const answerSchema = new mongoose.Schema(
  {
    mediaId: mongoose.Schema.Types.ObjectId,
    nama: String,
    kelas: String,
    answers: [String],
  },
  { timestamps: true },
);

const Answer = mongoose.model("Answer", answerSchema);

// ==============================
// 🔐 AUTH
// ==============================
const checkAuth = (req, res, next) => {
  if (req.session?.isAdmin) return next();
  res.status(401).json({ success: false });
};

// ==============================
// 📂 UPLOAD
// ==============================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==============================
// 🔐 LOGIN
// ==============================
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get("/check-login", (req, res) =>
  res.json({ loggedIn: !!req.session.isAdmin }),
);

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ==============================
// 📥 GET MEDIA
// ==============================
app.get("/api/media", async (req, res) => {
  const media = await Media.find().sort({ createdAt: -1 });
  res.json(media);
});

app.get("/api/media/:kelas/:submateri", async (req, res) => {
  const media = await Media.find({
    kelas: req.params.kelas,
    submateri: req.params.submateri,
  });
  res.json(media);
});

// ==============================
// ➕ CREATE MEDIA (UPDATED)
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
      const mainFile = req.files.mediaFile[0];

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: "auto", folder: "e-learning" },
            (err, result) => (err ? reject(err) : resolve(result)),
          )
          .end(mainFile.buffer);
      });

      let overlayUrl = null;

      if (req.files.overlayFile) {
        const overlayFile = req.files.overlayFile[0];
        const overlayResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { resource_type: "auto", folder: "e-learning" },
              (err, result) => (err ? reject(err) : resolve(result)),
            )
            .end(overlayFile.buffer);
        });
        overlayUrl = overlayResult.secure_url;
      }

      // 🔥 PARSE SOAL
      let questionItems = [];
      let questionType = null;

      if (req.body.isQuestion) {
        questionType = req.body.questionType;

        if (req.body.questionItems) {
          try {
            questionItems = JSON.parse(req.body.questionItems);
          } catch (e) {
            console.error("Gagal parse questionItems:", e);
          }
        }
      }

      const media = await Media.create({
        title: req.body.title,
        type: req.body.type,
        kelas: req.body.kelas,
        submateri: req.body.submateri,
        url: result.secure_url,

        overlayType: req.body.overlayType || null,
        overlayUrl,

        // 🔥 SOAL
        isQuestion:
          req.body.isQuestion === "true" ||
          req.body.isQuestion === true ||
          req.body.isQuestion === "on",
        questionType: req.body.questionType,
        questionItems,
      });

      res.json({ success: true, data: media });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  },
);

//update
app.put("/api/media/:id", checkAuth, async (req, res) => {
  try {
    const updated = await Media.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

//delete
app.delete("/api/media/:id", checkAuth, async (req, res) => {
  try {
    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ==============================
// 📤 SUBMIT JAWABAN SISWA
// ==============================
app.post("/api/submit-answer", async (req, res) => {
  try {
    const { mediaId, nama, kelas, answers } = req.body;

    const data = await Answer.create({
      mediaId,
      nama,
      kelas,
      answers,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ==============================
// 📊 ADMIN LIHAT JAWABAN
// ==============================
app.get("/api/answers", checkAuth, async (req, res) => {
  const data = await Answer.find().sort({ createdAt: -1 });
  res.json(data);
});

// ==============================
// 🚀 START SERVER
// ==============================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running ${PORT}`));
