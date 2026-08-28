const SUPABASE_URL = "https://emskvumpsrgpzsvqaqal.supabase.co";
const SUPABASE_KEY = "sb_publishable_tZYQG_Iv43JxwPEAnLBv9g_0OREh28M";

const BUCKET = "campus-media";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================
   ELEMENTS
========================= */

const fileInput = document.getElementById("mediaFile");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("uploadStatus");
const gallery = document.getElementById("gallery");
const refreshButton = document.getElementById("refreshButton");

const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginButton = document.getElementById("adminLoginButton");
const adminLogoutButton = document.getElementById("adminLogoutButton");
const adminStatus = document.getElementById("adminStatus");


let isAdmin = false;


/* =========================
   UPLOAD
========================= */

async function uploadMedia() {

  const file = fileInput.files[0];

  if (!file) {
    uploadStatus.textContent =
      "Please select a photo or video.";
    return;
  }

  uploadButton.disabled = true;

  uploadStatus.textContent =
    "Uploading... ⏳";

  try {

    const safeName =
      file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    const filePath =
      Date.now() + "-" + safeName;


    const { error } =
      await supabaseClient.storage
        .from(BUCKET)
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false
          }
        );


    if (error) {
      throw error;
    }


    uploadStatus.textContent =
      "Upload successful! 🎉";

    fileInput.value = "";

    await loadGallery();


  } catch (error) {

    console.error(error);

    uploadStatus.textContent =
      "Upload failed ❌ " +
      error.message;


  } finally {

    uploadButton.disabled = false;

  }
}


/* =========================
   LOAD GALLERY
========================= */

async function loadGallery() {

  gallery.innerHTML =
    "<p>Loading gallery... ⏳</p>";


  try {

    const { data, error } =
      await supabaseClient.storage
        .from(BUCKET)
        .list(
          "",
          {
            limit: 100,
            sortBy: {
              column: "created_at",
              order: "desc"
            }
          }
        );


    if (error) {
      throw error;
    }


    gallery.innerHTML = "";


    if (!data || data.length === 0) {

      gallery.innerHTML =
        "<p>No photos or videos yet.</p>";

      return;
    }


    data.forEach(file => {

      if (!file.name) return;


      const item =
        document.createElement("div");

      item.className =
        "gallery-item";


      const { data: publicData } =
        supabaseClient.storage
          .from(BUCKET)
          .getPublicUrl(file.name);


      const url =
        publicData.publicUrl;


      /* =========================
         IMAGE
      ========================= */

      if (
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i
          .test(file.name)
      ) {

        const img =
          document.createElement("img");

        img.src = url;

        img.alt = "Campus memory";

        img.loading = "lazy";

        img.title =
          "Click to view full screen";

        img.addEventListener(
          "click",
          () => openPreview(
            url,
            "image"
          )
        );

        item.appendChild(img);

      }


      /* =========================
         VIDEO
      ========================= */

      else if (
        /\.(mp4|webm|mov|ogg)$/i
          .test(file.name)
      ) {

        const video =
          document.createElement("video");

        video.src = url;

        video.controls = true;

        video.preload = "metadata";

        item.appendChild(video);

      }


      /* =========================
         DATE & TIME
      ========================= */

      if (file.created_at) {

        const date =
          new Date(file.created_at);


        const dateElement =
          document.createElement("div");

        dateElement.className =
          "media-date";


        dateElement.textContent =
          "📅 " +
          date.toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          ) +
          " • " +
          date.toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          );


        item.appendChild(
          dateElement
        );

      }


      /* =========================
         DOWNLOAD
      ========================= */

      const download =
        document.createElement("a");

      download.href = url;

      download.target = "_blank";

      download.rel = "noopener";

      download.className =
        "download-button";

      download.textContent =
        "⬇️ Download";


      item.appendChild(
        download
      );


      /* =========================
         ADMIN DELETE
      ========================= */

      if (isAdmin) {

        const deleteButton =
          document.createElement("button");

        deleteButton.className =
          "delete-button";

        deleteButton.textContent =
          "🗑️ Delete";


        deleteButton.addEventListener(
          "click",
          () => deleteMedia(
            file.name
          )
        );


        item.appendChild(
          deleteButton
        );

      }


      gallery.appendChild(item);

    });


  } catch (error) {

    console.error(error);

    gallery.innerHTML =
      "<p>Gallery Error: " +
      error.message +
      "</p>";

  }
}


/* =========================
   DELETE MEDIA
========================= */

async function deleteMedia(fileName) {

  if (!isAdmin) {
    return;
  }


  const confirmDelete =
    confirm(
      "Are you sure you want to delete this memory?"
    );


  if (!confirmDelete) {
    return;
  }


  try {

    const { error } =
      await supabaseClient.storage
        .from(BUCKET)
        .remove([
          fileName
        ]);


    if (error) {
      throw error;
    }


    alert(
      "Memory deleted successfully! 🗑️"
    );


    await loadGallery();


  } catch (error) {

    console.error(error);

    alert(
      "Delete failed ❌ " +
      error.message
    );

  }
}


/* =========================
   ADMIN LOGIN
========================= */

async function adminLogin() {

  const email =
    adminEmail.value.trim();

  const password =
    adminPassword.value;


  if (!email || !password) {

    adminStatus.textContent =
      "Please enter email and password.";

    return;
  }


  adminLoginButton.disabled = true;

  adminStatus.textContent =
    "Logging in... ⏳";


  try {

    const { data, error } =
      await supabaseClient.auth
        .signInWithPassword({
          email: email,
          password: password
        });


    if (error) {
      throw error;
    }


    if (!data.session) {
      throw new Error(
        "Login session not created."
      );
    }


    isAdmin = true;


    adminStatus.textContent =
      "Admin login successful! 🔐";


    adminEmail.value = "";

    adminPassword.value = "";


    adminLoginButton.style.display =
      "none";

    adminLogoutButton.style.display =
      "block";


    await loadGallery();


  } catch (error) {

    console.error(error);

    isAdmin = false;

    adminStatus.textContent =
      "Login failed ❌ " +
      error.message;


  } finally {

    adminLoginButton.disabled =
      false;

  }
}


/* =========================
   ADMIN LOGOUT
========================= */

async function adminLogout() {

  await supabaseClient.auth.signOut();

  isAdmin = false;


  adminStatus.textContent =
    "Admin logged out.";

  adminLoginButton.style.display =
    "block";

  adminLogoutButton.style.display =
    "none";


  await loadGallery();
}


/* =========================
   CHECK EXISTING SESSION
========================= */

async function checkAdminSession() {

  const { data } =
    await supabaseClient.auth
      .getSession();


  if (data.session) {

    isAdmin = true;

    adminLoginButton.style.display =
      "none";

    adminLogoutButton.style.display =
      "block";

    adminStatus.textContent =
      "Admin is logged in 🔐";

  } else {

    isAdmin = false;

  }

}


/* =========================
   FULL-SCREEN PREVIEW
========================= */

function openPreview(url, type) {

  const overlay =
    document.createElement("div");

  overlay.className =
    "preview-overlay";


  const closeButton =
    document.createElement("button");

  closeButton.className =
    "preview-close";

  closeButton.textContent =
    "✕";


  if (type === "image") {

    const image =
      document.createElement("img");

    image.src = url;

    image.className =
      "preview-media";


    overlay.appendChild(
      image
    );

  }


  if (type === "video") {

    const video =
      document.createElement("video");

    video.src = url;

    video.className =
      "preview-media";

    video.controls = true;

    video.autoplay = true;


    overlay.appendChild(
      video
    );

  }


  overlay.appendChild(
    closeButton
  );


  document.body.appendChild(
    overlay
  );


  function closePreview() {

    overlay.remove();

    document.removeEventListener(
      "keydown",
      escapeHandler
    );

  }


  function escapeHandler(event) {

    if (event.key === "Escape") {
      closePreview();
    }

  }


  closeButton.addEventListener(
    "click",
    closePreview
  );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target === overlay
      ) {
        closePreview();
      }

    }
  );


  document.addEventListener(
    "keydown",
    escapeHandler
  );

}


/* =========================
   BUTTON EVENTS
========================= */

uploadButton.addEventListener(
  "click",
  uploadMedia
);


refreshButton.addEventListener(
  "click",
  loadGallery
);


adminLoginButton.addEventListener(
  "click",
  adminLogin
);


adminLogoutButton.addEventListener(
  "click",
  adminLogout
);


/* =========================
   START
========================= */

window.addEventListener(
  "load",
  async () => {

    await checkAdminSession();

    await loadGallery();

  }
);
