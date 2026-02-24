// ==============================
// 🔐 LOGIN & DASHBOARD ADMIN
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const adminSection = document.getElementById("admin-section");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const BASE_URL = "https://final-o4p6.onrender.com";

  // cek login
  try {
    const res = await fetch(`${BASE_URL}/check-login`, {
      credentials: "include",
    });
    const data = await res.json();
    if (data.loggedIn) {
      if (loginSection && adminSection) {
        loginSection.style.display = "none";
        adminSection.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        await loadMediaList();
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
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          msg.textContent = "Login berhasil!";
          msg.style.color = "green";

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

  // logout handler
  const adminLink = document.querySelector('a[href="admin.html"]');
  if (adminLink) {
    adminLink.addEventListener("click", async (e) => {
      if (logoutBtn && logoutBtn.style.display !== "none") {
        e.preventDefault();
        await fetch(`${BASE_URL}/logout`, {
          method: "POST",
          credentials: "include",
        });

        localStorage.removeItem("lastClass");
        localStorage.removeItem("lastSubmateri");

        window.location.reload();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("lastClass");
      localStorage.removeItem("lastSubmateri");

      window.location.reload();
    });
  }
});

// ==============================
// 🎬 CRUD MEDIA ADMIN
// ==============================
const BASE_URL = "https://final-o4p6.onrender.com";

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
      alert("Lengkapi semua kolom!");
      return;
    }

    if (!editId) {
      if (!fileInput || fileInput.files.length === 0) {
        alert("Pilih file media.");
        return;
      }

      const fd = new FormData();
      fd.append("title", title);
      fd.append("type", type);
      fd.append("kelas", classLevel);
      fd.append("submateri", category);
      fd.append("mediaFile", fileInput.files[0]);

      try {
        const res = await fetch(`${BASE_URL}/api/media`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          alert("Media berhasil ditambahkan!");
          resetAdminForm();
          await loadMediaList();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("type", type);
      fd.append("kelas", classLevel);
      fd.append("submateri", category);

      if (fileInput.files.length > 0) {
        fd.append("mediaFile", fileInput.files[0]);
      }

      await fetch(`${BASE_URL}/api/media/${editId}`, {
        method: "PUT",
        body: fd,
        credentials: "include",
      });

      alert("Media berhasil diupdate");

      resetAdminForm();

      await loadMediaList();
    }
  });
}

// ==============================
// LOAD MEDIA LIST
// ==============================
async function loadMediaList() {
  const tbody = document.querySelector("#media-admin-list tbody");

  if (!tbody) return;

  const res = await fetch(`${BASE_URL}/api/media`, {
    credentials: "include",
  });

  const media = await res.json();

  tbody.innerHTML = "";

  media.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
<td>${item.title}</td>
<td>${item.type}</td>
<td>${item.kelas}</td>
<td>${item.submateri}</td>
<td><a href="${BASE_URL}${item.url}" target="_blank">Lihat</a></td>
<td>
<button class="editBtn" data-id="${item._id}">Edit</button>
<button class="deleteBtn" data-id="${item._id}">Hapus</button>
</td>
`;

    tbody.appendChild(tr);
  });
}

// ==============================
// TAMPILKAN MATERI
// ==============================
async function tampilkanMateri(kelas, submateri) {
  const res = await fetch(`${BASE_URL}/api/media/${kelas}/${submateri}`);

  const data = await res.json();

  const daftarMateri = document.getElementById("daftar-materi");

  daftarMateri.innerHTML = "";

  data.forEach((item) => {
    let html = `<h3>${item.title}</h3>`;

    if (item.type === "video") {
      html += `
<video controls width="300">
<source src="${BASE_URL}${item.url}">
</video>
`;
    }

    if (item.type === "audio") {
      html += `
<audio controls>
<source src="${BASE_URL}${item.url}">
</audio>
`;
    }

    daftarMateri.innerHTML += html;
  });
}

// ==============================
// HELPER
// ==============================
function resetAdminForm() {
  document.getElementById("editId").value = "";
}
