import { Spinner } from "./Spinner";

/** Tampil sementara potongan kode sebuah halaman diunduh. */
export function PageLoading() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "var(--color-navy-800)",
        }}
      >
        <Spinner label="Loading page" />
      </span>
    </div>
  );
}