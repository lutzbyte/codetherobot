import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/** Mengumumkan judul halaman baru kepada pembaca layar setiap kali route berpindah. */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Menunggu RouteSeo memperbarui document.title.
    const id = window.setTimeout(() => setMessage(document.title), 100);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <div className="sr-only" role="status" aria-live="polite">
      {message}
    </div>
  );
}