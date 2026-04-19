# Perbaikan Bug Upload Reset di Vercel

## Status: ✅ Dependency selesai

### 1. ✅ Update package.json - Tambah @vercel/blob (`npm install @vercel/blob` sukses)

### 2. ✅ Refactor server.js - Ganti multer/disk ke Vercel Blob (POST/PUT/DELETE) - siap untuk Vercel

### 3. ⚠️ Skip update script.js - URL hardcoded ke Render, ganti manual ke Vercel domain setelah deploy atau gunakan window.location.origin

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
