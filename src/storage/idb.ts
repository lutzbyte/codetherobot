const DB_NAME = "code-the-robot";
const STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB error"));
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    });
  } finally {
    db.close();
  }
}

/** Penyimpanan key-value sederhana di IndexedDB. Semua fungsi bisa gagal; pemanggil wajib menangani. */
export function idbGet(key: string): Promise<unknown> {
  return run("readonly", (store) => store.get(key));
}

export function idbSet(key: string, value: unknown): Promise<IDBValidKey> {
  return run("readwrite", (store) => store.put(value, key));
}

export function idbDelete(key: string): Promise<undefined> {
  return run("readwrite", (store) => store.delete(key));
}