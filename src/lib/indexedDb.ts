import { FullGenerationResult, PolicyDocument, AppSettings } from '../types/index.js';

const DB_NAME = 'OFIVE_Database';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';
const STORE_GENERATIONS = 'generations';
const STORE_SETTINGS = 'settings';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_GENERATIONS)) {
        db.createObjectStore(STORE_GENERATIONS, { keyPath: 'documentId' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Documents
export async function saveDocument(doc: PolicyDocument): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.put(doc);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllDocuments(): Promise<PolicyDocument[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.getAll();
    req.onsuccess = () => {
      const docs = req.result as PolicyDocument[];
      // Sort newest first
      docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      resolve(docs);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getDocumentById(id: string): Promise<PolicyDocument | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCUMENTS, STORE_GENERATIONS], 'readwrite');
    tx.objectStore(STORE_DOCUMENTS).delete(id);
    tx.objectStore(STORE_GENERATIONS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Generations (Summary, Products, Findings)
export async function saveGenerationResult(result: FullGenerationResult): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GENERATIONS, 'readwrite');
    const store = tx.objectStore(STORE_GENERATIONS);
    const req = store.put(result);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getGenerationResult(documentId: string): Promise<FullGenerationResult | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GENERATIONS, 'readonly');
    const store = tx.objectStore(STORE_GENERATIONS);
    const req = store.get(documentId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllGenerations(): Promise<FullGenerationResult[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GENERATIONS, 'readonly');
    const store = tx.objectStore(STORE_GENERATIONS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as FullGenerationResult[]);
    req.onerror = () => reject(req.error);
  });
}

// App Settings
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('app_settings');
      req.onsuccess = () => {
        if (req.result && req.result.settings) {
          resolve(req.result.settings);
        } else {
          resolve({
            geminiModel: 'gemini-3.8-flash',
            verificationModel: 'gemini-3.8-flash',
            defaultTone: 'formal',
          });
        }
      };
      req.onerror = () => {
        resolve({
          geminiModel: 'gemini-3.8-flash',
          verificationModel: 'gemini-3.8-flash',
          defaultTone: 'formal',
        });
      };
    });
  } catch {
    return {
      geminiModel: 'gemini-3.8-flash',
      verificationModel: 'gemini-3.8-flash',
      defaultTone: 'formal',
    };
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    const req = store.put({ id: 'app_settings', settings });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Clear All Data
export async function clearAllData(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_DOCUMENTS, STORE_GENERATIONS, STORE_SETTINGS], 'readwrite');
    tx.objectStore(STORE_DOCUMENTS).clear();
    tx.objectStore(STORE_GENERATIONS).clear();
    tx.objectStore(STORE_SETTINGS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
