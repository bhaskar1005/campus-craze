const SUPABASE_URL = "https://emskvumpsrgpzsvqaqal.supabase.co";
const SUPABASE_KEY = "sb_publishable_tZYQG_Iv43JxwPEAnLBv9g_0OREh28M";

const BUCKET = "campus-media";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const fileInput = document.getElementById("mediaFile");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("uploadStatus");
const gallery = document.getElementById("gallery");
const refreshButton = document.getElementById("refreshButton");


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
  uploadStatus.textContent = "Uploading... ⏳";

  try {

    const safeName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const filePath =
      Date.now() + "-" + safeName;

    const { error } =
      await supabaseClient.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

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
      "Upload failed ❌ " + error.message;

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
        .list("", {
          limit: 100,
          sortBy: {
            column: "created_at",
            order: "desc"
          }
        });

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


      /* PUBLIC URL */

      const { data: publicData } =
        supabaseClient.storage
          .from(BUCKET)
          .getPublicUrl(file.name);

      const url =
        publicData.publicUrl;


      /* PHOTO */

      if (
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i
          .test(file.name)
      ) {

        const img =
          document.createElement("img");

        img.src = url;

        img.alt =
          "Campus memory";

        img.loading = "lazy";

        item.appendChild(img);
      }


      /* VIDEO */

      else if (
        /\.(mp4|webm|mov|ogg)$/i
          .test(file.name)
      ) {

        const video =
          document.createElement("video");

        video.src = url;

        video.controls = true;

        video.preload =
          "metadata";

        item.appendChild(video);
      }


      /* DATE & TIME */

      if (file.created_at) {

        const date =
          new Date(file.created_at);

        const formattedDate =
          date.toLocaleString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            }
          );

        const dateElement =
          document.createElement("p");

        dateElement.className =
          "media-date";

        dateElement.textContent =
          "📅 " + formattedDate;

        item.appendChild(
          dateElement
        );
      }


      /* DOWNLOAD */

      const download =
        document.createElement("a");

      download.href = url;

      download.target = "_blank";

      download.rel =
        "noopener noreferrer";

      download.className =
        "download-button";

      download.textContent =
        "⬇️ Download";

      item.appendChild(
        download
      );


      gallery.appendChild(
        item
      );

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
   BUTTONS
========================= */

uploadButton.addEventListener(
  "click",
  uploadMedia
);

refreshButton.addEventListener(
  "click",
  loadGallery
);


/* =========================
   PAGE LOAD
========================= */

window.addEventListener(
  "load",
  loadGallery
);
