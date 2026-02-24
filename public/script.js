// ==============================
// 🌐 BASE URL CONFIG
// ==============================
const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://final-o4p6.onrender.com";

// ==============================
// 🔐 LOGIN SYSTEM
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const adminSection = document.getElementById("admin-section");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const msg = document.getElementById("login-msg");

  // ==========================
  // CEK STATUS LOGIN
  // ==========================
  try {
    const res = await fetch(`${BASE_URL}/check-login`, {
      credentials: "include",
    });

    const data = await res.json();

    if (data.loggedIn) {
      if (loginSection) loginSection.style.display = "none";
      if (adminSection) adminSection.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "inline-block";
      await loadMediaList();
    }
  } catch (err) {
    console.error("Gagal cek login:", err);
  }

  // ==========================
  // LOGIN BUTTON
  // ==========================
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!username || !password) {
        msg.textContent = "Isi username & password!";
        msg.style.color = "red";
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username, password }),
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
        console.error(err);
        msg.textContent = "Terjadi error saat login";
        msg.style.color = "red";
      }
    });
  }

  // ==========================
  // LOGOUT BUTTON
  // ==========================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      localStorage.clear();
      window.location.reload();
    });
  }
});

// ==============================
// 📦 CRUD MEDIA
// ==============================
const addBtn = document.getElementById("addBtn");

if (addBtn) {
  addBtn.addEventListener("click", async () => {
    const editId = document.getElementById("editId").value;
    const title = document.getElementById("title").value.trim();
    const type = document.getElementById("type").value;
    const kelas = document.getElementById("classLevel").value;
    const submateri = document.getElementById("category").value;
    const fileInput = document.getElementById("mediaFile");

    if (!title || !type || !kelas || !submateri) {
      alert("Lengkapi semua data!");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("type", type);
    fd.append("kelas", kelas);
    fd.append("submateri", submateri);

    if (fileInput.files.length) fd.append("mediaFile", fileInput.files[0]);

    try {
      const res = await fetch(
        editId ? `${BASE_URL}/api/media/${editId}` : `${BASE_URL}/api/media`,
        {
          method: editId ? "PUT" : "POST",
          credentials: "include",
          body: fd,
        },
      );

      const data = await res.json();

      if (data.success) {
        alert(editId ? "Media diperbarui!" : "Media ditambahkan!");
        resetForm();
        loadMediaList();
      } else {
        alert(data.message || "Gagal menyimpan data");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    }
  });
}

// ==============================
// 📋 LOAD MEDIA LIST
// ==============================
async function loadMediaList() {
  const tbody = document.querySelector("#media-admin-list tbody");
  if (!tbody) return;

  try {
    const res = await fetch(`${BASE_URL}/api/media`, {
      credentials: "include",
    });

    const data = await res.json();

    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Belum ada media</td></tr>`;
      return;
    }

    data.forEach((item) => {
      tbody.innerHTML += `
        <tr>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.type)}</td>
          <td>${escapeHtml(item.kelas)}</td>
          <td>${escapeHtml(item.submateri)}</td>
          <td>
            <a href="${BASE_URL}${item.url}" target="_blank">Lihat</a>
          </td>
          <td>
            <button onclick="editMedia('${item._id}')">Edit</button>
            <button onclick="deleteMedia('${item._id}')">Hapus</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("Gagal load media:", err);
  }
}

// ==============================
// ❌ DELETE MEDIA
// ==============================
async function deleteMedia(id) {
  if (!confirm("Yakin hapus media?")) return;

  const res = await fetch(`${BASE_URL}/api/media/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();

  if (data.success) loadMediaList();
}

// ==============================
// ✏ EDIT MEDIA
// ==============================
async function editMedia(id) {
  const res = await fetch(`${BASE_URL}/api/media`, {
    credentials: "include",
  });

  const data = await res.json();
  const item = data.find((x) => x._id === id);

  if (!item) return;

  document.getElementById("editId").value = item._id;
  document.getElementById("title").value = item.title;
  document.getElementById("type").value = item.type;
  document.getElementById("classLevel").value = item.kelas;
  document.getElementById("category").value = item.submateri;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==============================
// 🔄 RESET FORM
// ==============================
function resetForm() {
  document.querySelector(".admin-form").reset();
  document.getElementById("editId").value = "";
}

// ==============================
// 🔒 ESCAPE HTML
// ==============================
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
