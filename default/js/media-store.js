/**
 * MyCart Media Store — IndexedDB-backed image storage.
 * Solves the localStorage 5-10MB limit by storing images in IndexedDB
 * (up to ~50% of available disk space) and keeping only lightweight references.
 *
 * Each image gets a unique UUID. Products store an array of image IDs.
 * The system auto-deduplicates: same base64 → same ID.
 */

const MEDIA_DB_NAME = 'mycart_media';
const MEDIA_STORE_NAME = 'images';
const MEDIA_DB_VERSION = 1;

let mediaDB = null;

function mediaOpenDB() {
  return new Promise((resolve, reject) => {
    if (mediaDB) return resolve(mediaDB);
    const req = indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);
    req.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        db.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = function(e) {
      mediaDB = e.target.result;
      resolve(mediaDB);
    };
    req.onerror = function(e) {
      console.error('MediaDB open failed:', e.target.error);
      reject(e.target.error);
    };
  });
}

/** Save a base64 dataURL to IndexedDB. Returns the assigned UUID. */
async function mediaStoreSave(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    // Already a reference ID (UUID) — return as-is
    if (dataUrl && /^[a-f0-9-]{36}$/.test(dataUrl)) return dataUrl;
    // External URL or placeholder — store as-is
    if (dataUrl && (dataUrl.startsWith('http') || dataUrl.startsWith('/'))) return dataUrl;
    return dataUrl;
  }
  const db = await mediaOpenDB();
  // Check for duplicate by hash
  const existing = await mediaStoreFindByData(dataUrl);
  if (existing) return existing;

  const id = crypto.randomUUID ? crypto.randomUUID() : 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MEDIA_STORE_NAME], 'readwrite');
    const store = tx.objectStore(MEDIA_STORE_NAME);
    const record = { id, data: dataUrl, size: dataUrl.length, created: Date.now() };
    const req = store.put(record);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

/** Look up an existing image by its base64 content (dedup). */
function mediaStoreFindByData(dataUrl) {
  return new Promise((resolve) => {
    if (!mediaDB) { resolve(null); return; }
    const tx = mediaDB.transaction([MEDIA_STORE_NAME], 'readonly');
    const store = tx.objectStore(MEDIA_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = function() {
      const records = req.result || [];
      for (const r of records) {
        if (r.data === dataUrl) { resolve(r.id); return; }
      }
      resolve(null);
    };
    req.onerror = function() { resolve(null); };
  });
}

/** Fetch a single image by UUID. Returns the base64 dataURL or null. */
async function mediaStoreGet(id) {
  if (!id) return null;
  // External URLs / placeholders pass through
  if (id.startsWith('http') || id.startsWith('/') || id.startsWith('data:')) return id;
  if (id.includes('placehold.co')) return id;
  const db = await mediaOpenDB();
  return new Promise((resolve) => {
    const tx = db.transaction([MEDIA_STORE_NAME], 'readonly');
    const store = tx.objectStore(MEDIA_STORE_NAME);
    const req = store.get(id);
    req.onsuccess = function() {
      resolve(req.result ? req.result.data : null);
    };
    req.onerror = function() { resolve(null); };
  });
}

/** Delete an image by UUID. */
async function mediaStoreDelete(id) {
  if (!id || id.startsWith('http') || id.startsWith('/') || id.includes('placehold.co')) return;
  const db = await mediaOpenDB();
  return new Promise((resolve) => {
    const tx = db.transaction([MEDIA_STORE_NAME], 'readwrite');
    const store = tx.objectStore(MEDIA_STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/** Save multiple base64 images → array of UUIDs. */
async function mediaStoreSaveAll(dataUrls) {
  const ids = [];
  for (const url of dataUrls) {
    const id = await mediaStoreSave(url);
    ids.push(id);
  }
  return ids;
}

/** Fetch all images for an array of IDs → array of dataURLs. */
async function mediaStoreGetAll(ids) {
  if (!ids || !ids.length) return [];
  const results = [];
  for (const id of ids) {
    const data = await mediaStoreGet(id);
    if (data) results.push(data);
  }
  return results;
}

/** Delete all images for an array of IDs. */
async function mediaStoreDeleteAll(ids) {
  for (const id of ids) {
    await mediaStoreDelete(id);
  }
}

/** Save a product's images to media store. Returns a clean image-id array. */
async function mediaStorePackImages(images) {
  if (!images || !images.length) return ['https://placehold.co/400x400/e2e8f0/64748b?text=Product'];
  const packed = [];
  for (const img of images) {
    // Filter out placeholders
    if (img.includes('placehold.co')) continue;
    const id = await mediaStoreSave(img);
    packed.push(id);
  }
  return packed.length ? packed : ['https://placehold.co/400x400/e2e8f0/64748b?text=Product'];
}

/** Resolve a product's images from media store references → displayable dataURLs. */
async function mediaStoreResolveImages(images) {
  if (!images || !images.length) return ['https://placehold.co/400x400/e2e8f0/64748b?text=Product'];
  const resolved = await mediaStoreGetAll(images);
  return resolved.length ? resolved : ['https://placehold.co/400x400/e2e8f0/64748b?text=Product'];
}

/** Export all media store images as a JSON object { id: dataUrl }. */
async function mediaStoreExportAll() {
  const db = await mediaOpenDB();
  return new Promise((resolve) => {
    const tx = db.transaction([MEDIA_STORE_NAME], 'readonly');
    const store = tx.objectStore(MEDIA_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = function() {
      const map = {};
      (req.result || []).forEach(r => { map[r.id] = r.data; });
      resolve(map);
    };
    req.onerror = function() { resolve({}); };
  });
}

/** Import images from an exported map. */
async function mediaStoreImportAll(map) {
  const db = await mediaOpenDB();
  const tx = db.transaction([MEDIA_STORE_NAME], 'readwrite');
  const store = tx.objectStore(MEDIA_STORE_NAME);
  for (const [id, data] of Object.entries(map)) {
    store.put({ id, data, size: data.length, created: Date.now() });
  }
  return new Promise((resolve) => { tx.oncomplete = resolve; tx.onerror = resolve; });
}

/** Get total size of stored images in bytes. */
async function mediaStoreGetStats() {
  const db = await mediaOpenDB();
  return new Promise((resolve) => {
    const tx = db.transaction([MEDIA_STORE_NAME], 'readonly');
    const store = tx.objectStore(MEDIA_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = function() {
      const records = req.result || [];
      const totalSize = records.reduce((sum, r) => sum + (r.size || 0), 0);
      resolve({ count: records.length, totalBytes: totalSize });
    };
    req.onerror = function() { resolve({ count: 0, totalBytes: 0 }); };
  });
}

/** Clear all media from IndexedDB. */
async function mediaStoreClearAll() {
  const db = await mediaOpenDB();
  return new Promise((resolve) => {
    const tx = db.transaction([MEDIA_STORE_NAME], 'readwrite');
    const store = tx.objectStore(MEDIA_STORE_NAME);
    store.clear();
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
}
