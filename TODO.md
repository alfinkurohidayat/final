# Perbaikan Bug Upload Reset di Render - FIXED Cloudinary

## Status: ✅ Dependency selesai

### 1. ✅ Update package.json - Cloudinary deps (`npm i cloudinary multer`)

### 2. ✅ Refactor server.js - Cloudinary upload_stream persist (server-clean.js → server.js)

### 3. ✅ Update script.js - Hapus Render prefix, direct Cloudinary URL

### 4. [ ] Install deps: npm install (sudah dilakukan)

### 5. [ ] Test lokal (jika mungkin), push & redeploy Vercel

### 6. [ ] Verifikasi upload persist & display OK

**Catatan:** URL konfirmasi: https://final-9pgj.onrender.com/ (tapi katanya Vercel? Akan pakai dynamic window.location.origin untuk fleksibel).

### 2. [ ] Refactor server.js - Ganti multer/disk ke Vercel Blob (POST/PUT/DELETE)

### 3. [ ] Update public/script.js - Ganti hardcoded Render URL ke dynamic origin atau konfirmasi

### 4. [ ] Install deps: npm install

### 5. [ ] Test lokal (jika mungkin), push & redeploy Vercel

### 6. [ ] Verifikasi upload persist & display OK

**Catatan:** URL konfirmasi: https://final-9pgj.onrender.com/ (tapi katanya Vercel? Akan pakai dynamic window.location.origin untuk fleksibel).

Proses: Langkah per langkah, update TODO setelah selesai.
