// // ==============================
// // 🔐 LOGIN & DASHBOARD ADMIN
// // ==============================
// document.addEventListener("DOMContentLoaded", async () => {
//   const loginSection = document.getElementById("login-section");
//   const adminSection = document.getElementById("admin-section");
//   const loginBtn = document.getElementById("loginBtn");
//   const logoutBtn = document.getElementById("logoutBtn");

//   // cek login
//   try {
//     const res = await fetch("https://final-9pgj.onrender.com/check-login", {
//       credentials: "include",
//     });
//     const data = await res.json();
//     if (data.loggedIn) {
//       if (loginSection && adminSection) {
//         loginSection.style.display = "none";
//         adminSection.style.display = "block";
//         if (logoutBtn) logoutBtn.style.display = "inline-block";
//         await loadMediaList(); // tampilkan daftar media di admin
//       }
//     }
//   } catch (err) {
//     console.error("Gagal cek status login:", err);
//   }

//   // login handler
//   if (loginBtn) {
//     loginBtn.addEventListener("click", async () => {
//       const username = document.getElementById("username").value.trim();
//       const password = document.getElementById("password").value.trim();
//       const msg = document.getElementById("login-msg");

//       if (!username || !password) {
//         msg.textContent = "Isi username dan password!";
//         msg.style.color = "red";
//         return;
//       }

//       try {
//         const res = await fetch("https://final-9pgj.onrender.com/login", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ username, password }),
//           credentials: "include",
//         });
//         const data = await res.json();
//         if (data.success) {
//           msg.textContent = "Login berhasil!";
//           msg.style.color = "green";
//           // tampilkan panel admin
//           loginSection.style.display = "none";
//           adminSection.style.display = "block";
//           if (logoutBtn) logoutBtn.style.display = "inline-block";
//           await loadMediaList();
//         } else {
//           msg.textContent = data.message || "Login gagal";
//           msg.style.color = "red";
//         }
//       } catch (err) {
//         console.error("Error login:", err);
//         msg.textContent = "Terjadi error saat login";
//         msg.style.color = "red";
//       }
//     });
//   }

//   // logout handler (global link di header)
//   const adminLink = document.querySelector('a[href="admin.html"]');
//   if (adminLink) {
//     adminLink.addEventListener("click", async (e) => {
//       if (logoutBtn && logoutBtn.style.display !== "none") {
//         e.preventDefault();
//         await fetch("https://final-9pgj.onrender.com/logout", {
//           method: "POST",
//           credentials: "include",
//         });
//         localStorage.removeItem("lastClass");
//         localStorage.removeItem("lastSubmateri");
//         window.location.reload();
//       }
//     });
//   }

//   if (logoutBtn) {
//     logoutBtn.addEventListener("click", async () => {
//       await fetch("https://final-9pgj.onrender.com/logout", {
//         method: "POST",
//         credentials: "include",
//       });
//       localStorage.removeItem("lastClass");
//       localStorage.removeItem("lastSubmateri");
//       window.location.reload();
//     });
//   }
// });

// // ==============================
// // 🎬 CRUD MEDIA ADMIN (Tambah / Update / Delete)
// // ==============================
// const addBtnGlobal = document.getElementById("addBtn");
// if (addBtnGlobal) {
//   addBtnGlobal.addEventListener("click", async () => {
//     const editId = document.getElementById("editId")?.value || "";
//     const title = document.getElementById("title").value.trim();
//     const type = document.getElementById("type").value;
//     const classLevel = document.getElementById("classLevel").value;
//     const category = document.getElementById("category").value;
//     const fileInput = document.getElementById("mediaFile");

//     if (!title || !type || !classLevel || !category) {
//       alert("Lengkapi semua kolom (judul, tipe, kelas, kategori)!");
//       return;
//     }

//     // === 🟢 TAMBAH BARU (POST) ===
//     if (!editId) {
//       if (!fileInput || fileInput.files.length === 0) {
//         alert("Pilih file media (video/audio) sebelum menambah.");
//         return;
//       }

//       // const fd = new FormData();
//       // fd.append("title", title);
//       // fd.append("type", type);
//       // fd.append("kelas", classLevel);
//       // fd.append("submateri", category);
//       // fd.append("mediaFile", fileInput.files[0]);

//       const fd = new FormData();
//       fd.append("title", title);
//       fd.append("type", type);
//       fd.append("kelas", classLevel);
//       fd.append("submateri", category);
//       fd.append("mediaFile", fileInput.files[0]);

//       // 🔥 TAMBAHKAN INI
//       fd.append("overlayType", overlayType.value);
//       if (overlayFile.files.length > 0) {
//         fd.append("overlayFile", overlayFile.files[0]);
//       }

//       try {
//         const res = await fetch("https://final-9pgj.onrender.com/api/media", {
//           method: "POST",
//           body: fd,
//           credentials: "include",
//         });
//         const data = await res.json();
//         if (res.ok && data.success) {
//           alert("Media berhasil ditambahkan!");
//           resetAdminForm();
//           await loadMediaList();
//         } else {
//           alert("Gagal menambah media: " + (data.message || "Unknown"));
//         }
//       } catch (err) {
//         console.error("Gagal POST media:", err);
//         alert("Terjadi kesalahan saat menambah media.");
//       }

//       // === 🟢 UPDATE FILE DARI DEVICE (versi baru) ===
//     } else {
//       // Mode EDIT
//       if (fileInput && fileInput.files.length > 0) {
//         // Jika user ingin ganti file, kirim multipart pakai FormData
//         const fd = new FormData();
//         fd.append("title", title);
//         fd.append("type", type);
//         fd.append("kelas", classLevel);
//         fd.append("submateri", category);
//         fd.append("mediaFile", fileInput.files[0]);

//         try {
//           const res = await fetch(
//             `https://final-9pgj.onrender.com/api/media/${editId}`,
//             {
//               method: "PUT",
//               body: fd,
//               credentials: "include",
//             },
//           );
//           const data = await res.json();
//           if (res.ok && data.success) {
//             alert("Media dan file berhasil diperbarui!");
//             resetAdminForm();
//             await loadMediaList();
//           } else {
//             alert("Gagal update file: " + (data.message || "Unknown"));
//           }
//         } catch (err) {
//           console.error("Gagal PUT media:", err);
//           alert("Terjadi kesalahan saat memperbarui file.");
//         }
//       } else {
//         // Jika tidak mengganti file, kirim JSON biasa
//         try {
//           const payload = {
//             title,
//             type,
//             kelas: classLevel,
//             submateri: category,
//           };
//           const res = await fetch(
//             `https://final-9pgj.onrender.com/api/media/${editId}`,
//             {
//               method: "PUT",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify(payload),
//               credentials: "include",
//             },
//           );
//           const data = await res.json();
//           if (res.ok && data.success) {
//             alert("Data media berhasil diperbarui!");
//             resetAdminForm();
//             await loadMediaList();
//           } else {
//             alert("Gagal update data: " + (data.message || "Unknown"));
//           }
//         } catch (err) {
//           console.error("Gagal PUT media:", err);
//           alert("Terjadi kesalahan saat memperbarui data.");
//         }
//       }
//     }
//   });
// }

// function resetAdminForm() {
//   const form = document.querySelector(".admin-form");
//   if (form) form.reset();
//   const editIdEl = document.getElementById("editId");
//   if (editIdEl) editIdEl.value = "";
//   if (addBtnGlobal) addBtnGlobal.textContent = "Tambah Media";
// }

// // ==============================
// // 🧾 Fungsi Load & Render Daftar Media (Admin table)
// // ==============================
// async function loadMediaList() {
//   const tbody = document.querySelector("#media-admin-list tbody");
//   if (!tbody) return;

//   try {
//     const res = await fetch("https://final-9pgj.onrender.com/api/media", {
//       credentials: "include",
//     });
//     const media = await res.json();

//     tbody.innerHTML = "";
//     if (!media || media.length === 0) {
//       tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Belum ada media</td></tr>`;
//       return;
//     }

//     media.forEach((item) => {
//       const tr = document.createElement("tr");
//       const urlDisplay = item.url
//         ? `https://final-9pgj.onrender.com${item.url}`
//         : "-";
//       tr.innerHTML = `
//         <td>${escapeHtml(item.title)}</td>
//         <td>${escapeHtml(item.type)}</td>
//         <td>${escapeHtml(item.kelas || "-")}</td>
//         <td>${escapeHtml(item.submateri || "-")}</td>
//         <td>${item.url ? `<a href="${urlDisplay}" target="_blank">Lihat</a>` : "-"}</td>
//         <td>
//           <button class="editBtn" data-id="${item._id}">Edit</button>
//           <button class="deleteBtn" data-id="${item._id}">Hapus</button>
//         </td>
//       `;
//       tbody.appendChild(tr);
//     });

//     tbody.querySelectorAll(".deleteBtn").forEach((b) => {
//       b.addEventListener("click", async (e) => {
//         const id = e.target.dataset.id;
//         if (!confirm("Yakin ingin menghapus media ini?")) return;
//         try {
//           const res = await fetch(
//             `https://final-9pgj.onrender.com/api/media/${id}`,
//             {
//               method: "DELETE",
//               credentials: "include",
//             },
//           );
//           const data = await res.json();
//           if (res.ok && data.success) {
//             alert("Media dihapus");
//             await loadMediaList();
//           } else {
//             alert("Gagal menghapus: " + (data.message || ""));
//           }
//         } catch (err) {
//           console.error("Gagal delete:", err);
//           alert("Terjadi kesalahan saat menghapus.");
//         }
//       });
//     });

//     tbody.querySelectorAll(".editBtn").forEach((b) => {
//       b.addEventListener("click", async (e) => {
//         const id = e.target.dataset.id;
//         const item = media.find((m) => m._id === id);
//         if (!item) return alert("Data tidak ditemukan untuk diedit.");

//         document.getElementById("editId").value = item._id;
//         document.getElementById("title").value = item.title || "";
//         document.getElementById("type").value = item.type || "";
//         document.getElementById("classLevel").value = item.kelas || "";
//         document.getElementById("category").value = item.submateri || "";
//         addBtnGlobal.textContent = "Update Media";
//         window.scrollTo({ top: 0, behavior: "smooth" });
//       });
//     });
//   } catch (err) {
//     console.error("Gagal memuat daftar media:", err);
//   }
// }

// // ==============================
// // 🧭 NAVIGASI & TAMPILAN MATERI PADA HALAMAN INDEX
// // ==============================
// // (seluruh bagian ini tetap utuh tanpa diubah)
// document.addEventListener("DOMContentLoaded", () => {
//   const menuItems = document.querySelectorAll(".menu-vertikal a");
//   const submenu = document.getElementById("submenu");
//   const submenuTitle = document.getElementById("submenu-title");
//   const submenuContent = document.getElementById("submenu-content");
//   const daftarMateri = document.getElementById("daftar-materi");
//   const DM = document.getElementById("DM");

//   // fungsi untuk ubah isi DM
//   function ubahDM(teks) {
//     if (DM) DM.innerHTML = `<h3>${teks}</h3>`;
//   }

//   async function tampilkanMateri(kelas, submateri) {
//     localStorage.setItem("lastClass", kelas);
//     localStorage.setItem("lastSubmateri", submateri);
//     ubahDM(`Materi ${kelas} - ${submateri}`);

//     try {
//       const res = await fetch(
//         `https://final-9pgj.onrender.com/api/media/${encodeURIComponent(kelas)}/${encodeURIComponent(submateri)}`,
//       );
//       const data = await res.json();

//       daftarMateri.innerHTML = "";

//       if (!data || data.length === 0) {
//         daftarMateri.innerHTML = "<p>Tidak ada materi tersedia.</p>";
//         return;
//       }

//       data.forEach((item) => {
//         if (item.type !== "image") return;

//         const card = document.createElement("div");
//         card.className = "materi-card";

//         const title = document.createElement("h3");
//         title.textContent = item.title;

//         const img = document.createElement("img");
//         img.src = `https://final-9pgj.onrender.com${item.url}`;
//         img.style.width = "100%";
//         img.style.height = "200px";
//         img.style.objectFit = "cover";
//         img.style.borderRadius = "8px";
//         img.style.cursor = "pointer";

//         img.addEventListener("click", () => {
//           if (!item.overlayType || !item.overlayUrl) {
//             console.log("Tidak ada overlay untuk item ini");
//             return;
//           }

//           openOverlay(
//             item.overlayType,
//             `https://final-9pgj.onrender.com${item.overlayUrl}`,
//           );
//         });

//         // img.addEventListener("click", () => {
//         //   openOverlay("image", img.src);
//         //   //openOverlay("image", img.src);
//         // });

//         card.appendChild(title);
//         card.appendChild(img);
//         daftarMateri.appendChild(card);
//       });
//     } catch (err) {
//       console.error("Gagal memuat materi:", err);
//       daftarMateri.innerHTML = "<p>Terjadi kesalahan saat memuat materi.</p>";
//     }
//   }

//   async function tampilkanMediaApps() {
//     ubahDM("Media Audio & Video");

//     try {
//       const res = await fetch(`https://final-9pgj.onrender.com/api/media`);
//       const data = await res.json();

//       daftarMateri.innerHTML = "";

//       if (!data || data.length === 0) {
//         daftarMateri.innerHTML = "<p>Tidak ada media tersedia.</p>";
//         return;
//       }

//       data.forEach((item) => {
//         // ❌ Abaikan image
//         if (item.type === "image") return;

//         let mediaPreview = "";

//         if (item.type === "video") {
//           mediaPreview = `
//       <video width="100%" height="200" controls
//         src="https://final-9pgj.onrender.com${item.url}">
//       </video>
//     `;
//         }

//         if (item.type === "audio") {
//           mediaPreview = `
//       <audio controls
//         src="https://final-9pgj.onrender.com${item.url}">
//       </audio>
//     `;
//         }

//         const div = document.createElement("div");
//         div.className = "materi-card";
//         div.innerHTML = `
//     <h3>${escapeHtml(item.title)}</h3>
//     ${mediaPreview}
//   `;

//         daftarMateri.appendChild(div);
//       });
//     } catch (err) {
//       console.error("Gagal memuat media:", err);
//       daftarMateri.innerHTML = "<p>Terjadi kesalahan saat memuat media.</p>";
//     }
//   }

//   function showSubmateriList(kelas) {
//     if (submenuTitle) {
//       submenuTitle.textContent = kelas;
//     }
//     ubahDM(`Daftar Materi - ${kelas}`);
//     submenuContent.innerHTML = `
//       <li class="sub-item" data-sub="Material">Material</li>
//       <li class="sub-item" data-sub="Vocabulary">Vocabulary</li>
//       <li class="sub-item" data-sub="Tasks">Tasks</li>
//       <li class="sub-item" data-sub="Games">Games</li>
//     `;
//     submenu.classList.add("show");

//     daftarMateri.innerHTML = `
//       <div class="materi-card" data-sub="Material"><h3>Material</h3></div>
//       <div class="materi-card" data-sub="Vocabulary"><h3>Vocabulary</h3></div>
//       <div class="materi-card" data-sub="Tasks"><h3>Tasks</h3></div>
//       <div class="materi-card" data-sub="Games"><h3>Games</h3></div>
//     `;

//     document
//       .querySelectorAll(".sub-item, .materi-card[data-sub]")
//       .forEach((el) => {
//         el.addEventListener("click", () =>
//           tampilkanMateri(kelas, el.dataset.sub),
//         );
//       });
//   }

//   function showClassList() {
//     if (!submenuTitle || !submenuContent || !submenu || !daftarMateri) {
//       console.warn("Element navigation tidak ditemukan, skip showClassList");
//       return;
//     }

//     submenuTitle.textContent = "Resources";

//     ubahDM("Daftar Kelas");

//     submenuContent.innerHTML = `
//     <li class="dropdown" data-class="Class 10">Class 10 ▾</li>
//     <li class="dropdown" data-class="Class 11">Class 11 ▾</li>
//     <li class="dropdown" data-class="Class 12">Class 12 ▾</li>
//   `;

//     submenu.classList.add("show");

//     daftarMateri.innerHTML = `
//     <div class="materi-card" data-class="Class 10"><h3>Class 10</h3></div>
//     <div class="materi-card" data-class="Class 11"><h3>Class 11</h3></div>
//     <div class="materi-card" data-class="Class 12"><h3>Class 12</h3></div>
//   `;

//     // ✅ FIX: tambahkan event click
//     document.querySelectorAll("[data-class]").forEach((el) => {
//       el.addEventListener("click", () => {
//         const kelas = el.dataset.class;
//         showSubmateriList(kelas);
//       });
//     });
//   }

//   // 🔹 Menu navigasi utama
//   menuItems.forEach((item) => {
//     item.addEventListener("click", (e) => {
//       e.preventDefault();
//       menuItems.forEach((m) => m.classList.remove("hover"));
//       item.classList.add("hover");

//       switch (item.id) {
//         case "menu-resources":
//           showClassList();
//           break;
//         case "menu-classes":
//           submenuTitle.textContent = "Classes";
//           ubahDM("Halaman Classes");
//           submenuContent.innerHTML = "<li>Daftar kelas akan ditambahkan.</li>";
//           daftarMateri.innerHTML = "";
//           break;
//         case "menu-apps":
//           submenuTitle.textContent = "Media";
//           submenuContent.innerHTML =
//             "<li>Media belajar akan ditampilkan di sini.</li>";
//           submenu.classList.add("show");
//           tampilkanMediaApps();
//           break;
//         case "menu-support":
//           submenuTitle.textContent = "Support";
//           ubahDM("Pusat Bantuan");
//           submenuContent.innerHTML = "<li>Hubungi admin untuk bantuan.</li>";
//           daftarMateri.innerHTML = "";
//           break;
//         default:
//           ubahDM("Selamat Datang!");
//       }
//     });
//   });

//   // Tampilkan pertama kali
//   showClassList();

//   const lastClass = localStorage.getItem("lastClass");
//   const lastSubmateri = localStorage.getItem("lastSubmateri");
//   if (lastClass && lastSubmateri) {
//     setTimeout(() => {
//       tampilkanMateri(lastClass, lastSubmateri);
//       submenuTitle.textContent = lastClass;
//       submenu.classList.add("show");
//     }, 300);
//   }
// });

// // ==============================
// // Helper
// // ==============================
// function escapeHtml(unsafe) {
//   if (!unsafe && unsafe !== 0) return "";
//   return String(unsafe)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// //pop up

// const typeSelect = document.getElementById("type");
// const overlayType = document.getElementById("overlayType");
// const overlayFile = document.getElementById("overlayFile");

// if (typeSelect && overlayType && overlayFile) {
//   // hanya tampil jika type = image
//   typeSelect.addEventListener("change", () => {
//     if (typeSelect.value === "image") {
//       overlayType.style.display = "block";
//     } else {
//       overlayType.value = "";
//       overlayType.style.display = "none";
//       overlayFile.style.display = "none";
//     }
//   });

//   // tampilkan file jika overlay dipilih
//   overlayType.addEventListener("change", () => {
//     if (overlayType.value) {
//       overlayFile.style.display = "block";
//       overlayFile.accept =
//         overlayType.value === "audio" ? "audio/*" : "video/*";
//     } else {
//       overlayFile.style.display = "none";
//     }
//   });
// }
// const closeBtn = document.getElementById("closeModal");
// if (closeBtn) {
//   closeBtn.onclick = function () {
//     document.getElementById("mediaModal").style.display = "none";
//     document.getElementById("modalBody").innerHTML = "";
//   };
// }
// // ==============================
// // POPUP OVERLAY FUNCTION
// // ==============================

// function openOverlay(type, url) {
//   const modal = document.getElementById("mediaModal");
//   const body = document.getElementById("modalBody");

//   if (!modal || !body) return;

//   body.innerHTML = "";

//   if (type === "image") {
//     body.innerHTML = `<img src="${url}" style="width:100%">`;
//   }

//   // if (type === "image") {
//   //   body.innerHTML = `<img src="${url}" style="width:100%">`;
//   // }

//   if (type === "video") {
//     body.innerHTML = `
//       <video controls style="width:100%">
//         <source src="${url}">
//       </video>
//     `;
//   }

//   if (type === "audio") {
//     body.innerHTML = `
//       <audio controls style="width:100%">
//         <source src="${url}">
//       </audio>
//     `;
//   }

//   modal.style.display = "flex";
// }

// // WAJIB karena kamu pakai type="module"
// window.openOverlay = openOverlay;

//
//
//
//
//

// ==============================
// 🔐 LOGIN & DASHBOARD ADMIN
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const adminSection = document.getElementById("admin-section");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // cek login
  try {
    const res = await fetch("https://final-9pgj.onrender.com/check-login", {
      credentials: "include",
    });
    const data = await res.json();
    if (data.loggedIn) {
      if (loginSection && adminSection) {
        loginSection.style.display = "none";
        adminSection.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        await loadMediaList(); // tampilkan daftar media di admin
      }
    }
  } catch (err) {
    console.error("Gagal cek status login:", err);
  }

  // login handler
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const msg = document.getElementById("login-msg");

      if (!username || !password) {
        msg.textContent = "Isi username dan password!";
        msg.style.color = "red";
        return;
      }

      try {
        const res = await fetch("https://final-9pgj.onrender.com/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          msg.textContent = "Login berhasil!";
          msg.style.color = "green";
          // tampilkan panel admin
          loginSection.style.display = "none";
          adminSection.style.display = "block";
          if (logoutBtn) logoutBtn.style.display = "inline-block";
          await loadMediaList();
        } else {
          msg.textContent = data.message || "Login gagal";
          msg.style.color = "red";
        }
      } catch (err) {
        console.error("Error login:", err);
        msg.textContent = "Terjadi error saat login";
        msg.style.color = "red";
      }
    });
  }

  // logout handler (global link di header)
  const adminLink = document.querySelector('a[href="admin.html"]');
  if (adminLink) {
    adminLink.addEventListener("click", async (e) => {
      if (logoutBtn && logoutBtn.style.display !== "none") {
        e.preventDefault();
        await fetch("https://final-9pgj.onrender.com/logout", {
          method: "POST",
          credentials: "include",
        });
        localStorage.clear(); // hapus semua state
        window.location.reload();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("https://final-9pgj.onrender.com/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.clear();
      window.location.reload();
    });
  }

  // ===== Restore Admin Form State jika ada =====
  const editIdEl = document.getElementById("editId");
  const titleEl = document.getElementById("title");
  const typeEl = document.getElementById("type");
  const classLevelEl = document.getElementById("classLevel");
  const categoryEl = document.getElementById("category");
  const overlayTypeEl = document.getElementById("overlayType");

  if (editIdEl) editIdEl.value = localStorage.getItem("admin_editId") || "";
  if (titleEl) titleEl.value = localStorage.getItem("admin_title") || "";
  if (typeEl) typeEl.value = localStorage.getItem("admin_type") || "";
  if (classLevelEl)
    classLevelEl.value = localStorage.getItem("admin_classLevel") || "";
  if (categoryEl)
    categoryEl.value = localStorage.getItem("admin_category") || "";
  if (overlayTypeEl)
    overlayTypeEl.value = localStorage.getItem("admin_overlayType") || "";

  // Simpan form admin ke localStorage saat berubah
  [titleEl, typeEl, classLevelEl, categoryEl, overlayTypeEl, editIdEl].forEach(
    (el) => {
      if (!el) return;
      el.addEventListener("input", () => {
        if (titleEl) localStorage.setItem("admin_title", titleEl.value);
        if (typeEl) localStorage.setItem("admin_type", typeEl.value);
        if (classLevelEl)
          localStorage.setItem("admin_classLevel", classLevelEl.value);
        if (categoryEl)
          localStorage.setItem("admin_category", categoryEl.value);
        if (overlayTypeEl)
          localStorage.setItem("admin_overlayType", overlayTypeEl.value);
        if (editIdEl) localStorage.setItem("admin_editId", editIdEl.value);
      });
    },
  );
});

// ==============================
// 🎬 CRUD MEDIA ADMIN (Tambah / Update / Delete)
// ==============================
const addBtnGlobal = document.getElementById("addBtn");
if (addBtnGlobal) {
  addBtnGlobal.addEventListener("click", async () => {
    const editId = document.getElementById("editId")?.value || "";
    const title = document.getElementById("title").value.trim();
    const type = document.getElementById("type").value;
    const classLevel = document.getElementById("classLevel").value;
    const category = document.getElementById("category").value;
    const fileInput = document.getElementById("mediaFile");

    if (!title || !type || !classLevel || !category) {
      alert("Lengkapi semua kolom (judul, tipe, kelas, kategori)!");
      return;
    }

    // === 🟢 TAMBAH BARU (POST) ===
    if (!editId) {
      if (!fileInput || fileInput.files.length === 0) {
        alert("Pilih file media (video/audio) sebelum menambah.");
        return;
      }

      const fd = new FormData();
      fd.append("title", title);
      fd.append("type", type);
      fd.append("kelas", classLevel);
      fd.append("submateri", category);
      fd.append("mediaFile", fileInput.files[0]);

      fd.append("overlayType", overlayType.value);
      if (overlayFile.files.length > 0) {
        fd.append("overlayFile", overlayFile.files[0]);
      }

      try {
        const res = await fetch("https://final-9pgj.onrender.com/api/media", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Media berhasil ditambahkan!");
          resetAdminForm();
          await loadMediaList();
        } else {
          alert("Gagal menambah media: " + (data.message || "Unknown"));
        }
      } catch (err) {
        console.error("Gagal POST media:", err);
        alert("Terjadi kesalahan saat menambah media.");
      }

      // === 🟢 UPDATE FILE DARI DEVICE (versi baru) ===
    } else {
      const fd =
        fileInput && fileInput.files.length > 0 ? new FormData() : null;
      if (fd) {
        fd.append("title", title);
        fd.append("type", type);
        fd.append("kelas", classLevel);
        fd.append("submateri", category);
        fd.append("mediaFile", fileInput.files[0]);

        try {
          const res = await fetch(
            `https://final-9pgj.onrender.com/api/media/${editId}`,
            {
              method: "PUT",
              body: fd,
              credentials: "include",
            },
          );
          const data = await res.json();
          if (res.ok && data.success) {
            alert("Media dan file berhasil diperbarui!");
            resetAdminForm();
            await loadMediaList();
          } else {
            alert("Gagal update file: " + (data.message || "Unknown"));
          }
        } catch (err) {
          console.error("Gagal PUT media:", err);
          alert("Terjadi kesalahan saat memperbarui file.");
        }
      } else {
        try {
          const payload = {
            title,
            type,
            kelas: classLevel,
            submateri: category,
          };
          const res = await fetch(
            `https://final-9pgj.onrender.com/api/media/${editId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              credentials: "include",
            },
          );
          const data = await res.json();
          if (res.ok && data.success) {
            alert("Data media berhasil diperbarui!");
            resetAdminForm();
            await loadMediaList();
          } else {
            alert("Gagal update data: " + (data.message || "Unknown"));
          }
        } catch (err) {
          console.error("Gagal PUT media:", err);
          alert("Terjadi kesalahan saat memperbarui data.");
        }
      }
    }
  });
}

function resetAdminForm() {
  const form = document.querySelector(".admin-form");
  if (form) form.reset();
  const editIdEl = document.getElementById("editId");
  if (editIdEl) editIdEl.value = "";
  if (addBtnGlobal) addBtnGlobal.textContent = "Tambah Media";

  // Hapus localStorage admin form
  localStorage.removeItem("admin_editId");
  localStorage.removeItem("admin_title");
  localStorage.removeItem("admin_type");
  localStorage.removeItem("admin_classLevel");
  localStorage.removeItem("admin_category");
  localStorage.removeItem("admin_overlayType");
}

// ==============================
// 🧾 Fungsi Load & Render Daftar Media (Admin table)
// ==============================
async function loadMediaList() {
  const tbody = document.querySelector("#media-admin-list tbody");
  if (!tbody) return;

  try {
    const res = await fetch("https://final-9pgj.onrender.com/api/media", {
      credentials: "include",
    });
    const media = await res.json();

    tbody.innerHTML = "";
    if (!media || media.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Belum ada media</td></tr>`;
      return;
    }

    media.forEach((item) => {
      const tr = document.createElement("tr");
      const urlDisplay = item.url
        ? `https://final-9pgj.onrender.com${item.url}`
        : "-";
      tr.innerHTML = `
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.type)}</td>
        <td>${escapeHtml(item.kelas || "-")}</td>
        <td>${escapeHtml(item.submateri || "-")}</td>
        <td>${item.url ? `<a href="${urlDisplay}" target="_blank">Lihat</a>` : "-"}</td>
        <td>
          <button class="editBtn" data-id="${item._id}">Edit</button>
          <button class="deleteBtn" data-id="${item._id}">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".deleteBtn").forEach((b) => {
      b.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Yakin ingin menghapus media ini?")) return;
        try {
          const res = await fetch(
            `https://final-9pgj.onrender.com/api/media/${id}`,
            {
              method: "DELETE",
              credentials: "include",
            },
          );
          const data = await res.json();
          if (res.ok && data.success) {
            alert("Media dihapus");
            await loadMediaList();
          } else {
            alert("Gagal menghapus: " + (data.message || ""));
          }
        } catch (err) {
          console.error("Gagal delete:", err);
          alert("Terjadi kesalahan saat menghapus.");
        }
      });
    });

    tbody.querySelectorAll(".editBtn").forEach((b) => {
      b.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const item = media.find((m) => m._id === id);
        if (!item) return alert("Data tidak ditemukan untuk diedit.");

        document.getElementById("editId").value = item._id;
        document.getElementById("title").value = item.title || "";
        document.getElementById("type").value = item.type || "";
        document.getElementById("classLevel").value = item.kelas || "";
        document.getElementById("category").value = item.submateri || "";
        addBtnGlobal.textContent = "Update Media";

        // simpan state ke localStorage agar tidak hilang saat idle/refresh
        localStorage.setItem("admin_editId", item._id);
        localStorage.setItem("admin_title", item.title || "");
        localStorage.setItem("admin_type", item.type || "");
        localStorage.setItem("admin_classLevel", item.kelas || "");
        localStorage.setItem("admin_category", item.submateri || "");

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  } catch (err) {
    console.error("Gagal memuat daftar media:", err);
  }
}

// ==============================
// 🧭 NAVIGASI & TAMPILAN MATERI PADA HALAMAN INDEX
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".menu-vertikal a");
  const submenu = document.getElementById("submenu");
  const submenuTitle = document.getElementById("submenu-title");
  const submenuContent = document.getElementById("submenu-content");
  const daftarMateri = document.getElementById("daftar-materi");
  const DM = document.getElementById("DM");

  function ubahDM(teks) {
    if (DM) DM.innerHTML = `<h3>${teks}</h3>`;
  }

  async function tampilkanMateri(kelas, submateri) {
    localStorage.setItem("lastClass", kelas);
    localStorage.setItem("lastSubmateri", submateri);
    ubahDM(`Materi ${kelas} - ${submateri}`);

    try {
      const res = await fetch(
        `https://final-9pgj.onrender.com/api/media/${encodeURIComponent(kelas)}/${encodeURIComponent(submateri)}`,
      );
      const data = await res.json();

      daftarMateri.innerHTML = "";

      if (!data || data.length === 0) {
        daftarMateri.innerHTML = "<p>Tidak ada materi tersedia.</p>";
        return;
      }

      data.forEach((item) => {
        if (item.type !== "image") return;

        const card = document.createElement("div");
        card.className = "materi-card";

        const title = document.createElement("h3");
        title.textContent = item.title;

        const img = document.createElement("img");
        img.src = `https://final-9pgj.onrender.com${item.url}`;
        img.style.width = "100%";
        img.style.height = "200px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "8px";
        img.style.cursor = "pointer";

        img.addEventListener("click", () => {
          if (!item.overlayType || !item.overlayUrl) {
            console.log("Tidak ada overlay untuk item ini");
            return;
          }
          openOverlay(
            item.overlayType,
            `https://final-9pgj.onrender.com${item.overlayUrl}`,
          );
        });

        card.appendChild(title);
        card.appendChild(img);
        daftarMateri.appendChild(card);
      });
    } catch (err) {
      console.error("Gagal memuat materi:", err);
      daftarMateri.innerHTML = "<p>Terjadi kesalahan saat memuat materi.</p>";
    }
  }

  async function tampilkanMediaApps() {
    ubahDM("Media Audio & Video");

    try {
      const res = await fetch(`https://final-9pgj.onrender.com/api/media`);
      const data = await res.json();

      daftarMateri.innerHTML = "";

      if (!data || data.length === 0) {
        daftarMateri.innerHTML = "<p>Tidak ada media tersedia.</p>";
        return;
      }

      data.forEach((item) => {
        if (item.type === "image") return;

        let mediaPreview = "";

        if (item.type === "video") {
          mediaPreview = `<video width="100%" height="200" controls src="https://final-9pgj.onrender.com${item.url}"></video>`;
        }

        if (item.type === "audio") {
          mediaPreview = `<audio controls src="https://final-9pgj.onrender.com${item.url}"></audio>`;
        }

        const div = document.createElement("div");
        div.className = "materi-card";
        div.innerHTML = `<h3>${escapeHtml(item.title)}</h3>${mediaPreview}`;

        daftarMateri.appendChild(div);
      });
    } catch (err) {
      console.error("Gagal memuat media:", err);
      daftarMateri.innerHTML = "<p>Terjadi kesalahan saat memuat media.</p>";
    }
  }

  function showSubmateriList(kelas) {
    if (submenuTitle) submenuTitle.textContent = kelas;
    ubahDM(`Daftar Materi - ${kelas}`);
    submenuContent.innerHTML = `
      <li class="sub-item" data-sub="Material">Material</li>
      <li class="sub-item" data-sub="Vocabulary">Vocabulary</li>
      <li class="sub-item" data-sub="Tasks">Tasks</li>
      <li class="sub-item" data-sub="Games">Games</li>
    `;
    submenu.classList.add("show");

    daftarMateri.innerHTML = `
      <div class="materi-card" data-sub="Material"><h3>Material</h3></div>
      <div class="materi-card" data-sub="Vocabulary"><h3>Vocabulary</h3></div>
      <div class="materi-card" data-sub="Tasks"><h3>Tasks</h3></div>
      <div class="materi-card" data-sub="Games"><h3>Games</h3></div>
    `;

    document
      .querySelectorAll(".sub-item, .materi-card[data-sub]")
      .forEach((el) => {
        el.addEventListener("click", () =>
          tampilkanMateri(kelas, el.dataset.sub),
        );
      });
  }

  function showClassList() {
    if (!submenuTitle || !submenuContent || !submenu || !daftarMateri) return;

    submenuTitle.textContent = "Resources";
    ubahDM("Daftar Kelas");

    submenuContent.innerHTML = `
      <li class="dropdown" data-class="Class 10">Class 10 ▾</li>
      <li class="dropdown" data-class="Class 11">Class 11 ▾</li>
      <li class="dropdown" data-class="Class 12">Class 12 ▾</li>
    `;

    submenu.classList.add("show");

    daftarMateri.innerHTML = `
      <div class="materi-card" data-class="Class 10"><h3>Class 10</h3></div>
      <div class="materi-card" data-class="Class 11"><h3>Class 11</h3></div>
      <div class="materi-card" data-class="Class 12"><h3>Class 12</h3></div>
    `;

    document.querySelectorAll("[data-class]").forEach((el) => {
      el.addEventListener("click", () => showSubmateriList(el.dataset.class));
    });
  }

  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      menuItems.forEach((m) => m.classList.remove("hover"));
      item.classList.add("hover");

      switch (item.id) {
        case "menu-resources":
          showClassList();
          break;
        case "menu-classes":
          submenuTitle.textContent = "Classes";
          ubahDM("Halaman Classes");
          submenuContent.innerHTML = "<li>Daftar kelas akan ditambahkan.</li>";
          daftarMateri.innerHTML = "";
          break;
        case "menu-apps":
          submenuTitle.textContent = "Media";
          submenuContent.innerHTML =
            "<li>Media belajar akan ditampilkan di sini.</li>";
          submenu.classList.add("show");
          tampilkanMediaApps();
          break;
        case "menu-support":
          submenuTitle.textContent = "Support";
          ubahDM("Pusat Bantuan");
          submenuContent.innerHTML = "<li>Hubungi admin untuk bantuan.</li>";
          daftarMateri.innerHTML = "";
          break;
        default:
          ubahDM("Selamat Datang!");
      }
    });
  });

  // restore last viewed materi jika ada
  const lastClass = localStorage.getItem("lastClass");
  const lastSubmateri = localStorage.getItem("lastSubmateri");
  if (lastClass && lastSubmateri) {
    setTimeout(() => {
      tampilkanMateri(lastClass, lastSubmateri);
      submenuTitle.textContent = lastClass;
      submenu.classList.add("show");
    }, 300);
  }

  showClassList();
});

// ==============================
// Helper
// ==============================
function escapeHtml(unsafe) {
  if (!unsafe && unsafe !== 0) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==============================
// POPUP OVERLAY
// ==============================
const typeSelect = document.getElementById("type");
const overlayType = document.getElementById("overlayType");
const overlayFile = document.getElementById("overlayFile");

if (typeSelect && overlayType && overlayFile) {
  typeSelect.addEventListener("change", () => {
    if (typeSelect.value === "image") {
      overlayType.style.display = "block";
    } else {
      overlayType.value = "";
      overlayType.style.display = "none";
      overlayFile.style.display = "none";
    }
  });

  overlayType.addEventListener("change", () => {
    if (overlayType.value) {
      overlayFile.style.display = "block";
      overlayFile.accept =
        overlayType.value === "audio" ? "audio/*" : "video/*";
    } else {
      overlayFile.style.display = "none";
    }
  });
}

const closeBtn = document.getElementById("closeModal");
if (closeBtn) {
  closeBtn.onclick = function () {
    document.getElementById("mediaModal").style.display = "none";
    document.getElementById("modalBody").innerHTML = "";
  };
}

function openOverlay(type, url) {
  const modal = document.getElementById("mediaModal");
  const body = document.getElementById("modalBody");

  if (!modal || !body) return;

  body.innerHTML = "";

  if (type === "image") {
    body.innerHTML = `<img src="${url}" style="width:100%">`;
  }

  if (type === "video") {
    body.innerHTML = `<video controls style="width:100%"><source src="${url}"></video>`;
  }

  if (type === "audio") {
    body.innerHTML = `<audio controls style="width:100%"><source src="${url}"></audio>`;
  }

  modal.style.display = "flex";
}

window.openOverlay = openOverlay;
