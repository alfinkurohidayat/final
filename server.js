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
// 🔗 Koneksi MongoDB Compass
// ==============================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Compass terhubung"))
  .catch((err) => console.error("❌ Gagal konek MongoDB:", err));

// ==============================
// 📦 Schema MongoDB
// ==============================
const mediaSchema = new mongoose.Schema({
  title: String, // Judul materi
  type: String, // "video" atau "audio"
  url: String, // Path upload file
  kelas: String, // Contoh: "Class 10"
  submateri: String, // Contoh: "Material" / "Vocabulary"
});

const Media = mongoose.model("Media", mediaSchema);

// ==============================
// ⚙️ Middleware
// ==============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("trust proxy", 1); // WAJIB untuk Render / HTTPS

app.use(
  session({
    secret: process.env.SESSION_SECRET || "rahasia-super-aman",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
      secure: true, // WAJIB untuk HTTPS
      sameSite: "none", // supaya bisa cross-domain
    },
  }),
);

// ==============================
// 📂 Konfigurasi Upload File
// ==============================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`);
  },
});

const upload = multer({ storage });

// ==============================
// 🔐 Middleware Autentikasi Admin
// ==============================
function checkAuth(req, res, next) {
  if (req.session.isAdmin) next();
  else res.status(403).json({ message: "Akses ditolak!" });
}

// ==============================
// 🔑 Login Admin
// ==============================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.isAdmin = true;
    return res.json({ success: true, message: "Login berhasil!" });
  }

  res.status(401).json({
    success: false,
    message: "Login gagal! Username atau password salah.",
  });
});

// 🔍 Cek status login
app.get("/check-login", (req, res) => {
  res.json({ loggedIn: !!req.session.isAdmin });
});

// 🚪 Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Gagal logout:", err);
      return res.status(500).json({ success: false, message: "Gagal logout!" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Berhasil logout!" });
  });
});

// ==============================
// 🎥 API Media (CRUD)
// ==============================

// 🔹 Ambil semua media
app.get("/api/media", async (req, res) => {
  try {
    const data = await Media.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data media." });
  }
});

// 🔹 Tambah media baru
app.post("/api/media", upload.single("mediaFile"), async (req, res) => {
  try {
    const { title, type, kelas, submateri } = req.body;
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File tidak ditemukan" });
    }

    const media = new Media({
      title,
      type,
      kelas,
      submateri,
      url: `/uploads/${req.file.filename}`,
    });

    await media.save();
    res.json({
      success: true,
      message: "Media berhasil ditambahkan",
      data: media,
    });
  } catch (err) {
    console.error("Gagal menambah media:", err);
    res.status(500).json({ success: false, message: "Gagal menambah media" });
  }
});

// 🟢 UPDATE MEDIA (dengan / tanpa file baru)
// ===============================
app.put("/api/media/:id", upload.single("mediaFile"), async (req, res) => {
  try {
    const { title, type, kelas, submateri } = req.body;
    const updateData = { title, type, kelas, submateri };

    // Jika ada file baru diunggah
    if (req.file) {
      updateData.url = `/uploads/${req.file.filename}`;
    }

    const updated = await Media.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Media tidak ditemukan" });
    }

    res.json({
      success: true,
      message: "Media berhasil diperbarui",
      data: updated,
    });
  } catch (err) {
    console.error("Gagal update media:", err);
    res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui media" });
  }
});

// 🔹 Hapus media
app.delete("/api/media/:id", checkAuth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media)
      return res
        .status(404)
        .json({ success: false, message: "Media tidak ditemukan." });

    if (media.url && fs.existsSync(path.join(__dirname, media.url))) {
      fs.unlinkSync(path.join(__dirname, media.url));
    }

    await media.deleteOne();
    res.json({ success: true, message: "Media berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal menghapus media." });
  }
});

// 🔹 Ambil media berdasarkan kelas & submateri
app.get("/api/media/:kelas/:submateri", async (req, res) => {
  try {
    const { kelas, submateri } = req.params;
    const data = await Media.find({ kelas, submateri });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data berdasarkan kelas." });
  }
});

// ==============================
// 🚀 Jalankan Server
// ==============================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`),
);
