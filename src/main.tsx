import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initAds } from "./ads/adService";
import { initAudio } from "./audio";
import { getCatalog } from "./data/levels/catalog";
import { hydrateProgress } from "./progress/progress";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/polish.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Elemen #root tidak ditemukan");
}
const root = rootEl;

initAudio();
initAds();

/** Mengunduh potongan kode game di latar belakang, kecuali pemain memakai mode hemat data. */
function prefetchGame(): void {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  if (connection?.saveData) return;
  void import("./pages/GameplayPage");
}

function start(): void {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  // Menyiapkan katalog 75 level agar halaman level tidak tersendat.
  window.setTimeout(() => {
    getCatalog();
  }, 400);
  window.setTimeout(prefetchGame, 2500);
}

// Memuat progres dari IndexedDB sebelum tampil, dengan batas waktu agar aplikasi tidak menunggu terlalu lama.
const timeout = new Promise<void>((resolve) => {
  window.setTimeout(resolve, 1500);
});
void Promise.race([hydrateProgress(), timeout]).then(start, start);