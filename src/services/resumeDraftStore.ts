const DATABASE_NAME = "folio-resume-builder";
const DATABASE_VERSION = 1;
const DRAFT_STORE_NAME = "resume-drafts";
const ACTIVE_DRAFT_KEY = "active";

export interface ResumeDraft {
  id: typeof ACTIVE_DRAFT_KEY;
  markdown: string;
  fileName: string;
  savedAt: string;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error ?? new Error("Draft request failed.")), { once: true });
  });
}

function transactionFinished(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error ?? new Error("Draft transaction was aborted.")), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error ?? new Error("Draft transaction failed.")), { once: true });
  });
}

async function openDraftDatabase(): Promise<IDBDatabase> {
  if (!("indexedDB" in globalThis)) throw new Error("IndexedDB is not available.");
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.addEventListener("upgradeneeded", () => {
    if (!request.result.objectStoreNames.contains(DRAFT_STORE_NAME)) {
      request.result.createObjectStore(DRAFT_STORE_NAME, { keyPath: "id" });
    }
  });
  return requestResult(request);
}

export async function saveResumeDraft(
  markdown: string,
  fileName: string,
  savedAt = new Date().toISOString(),
): Promise<ResumeDraft> {
  const database = await openDraftDatabase();
  try {
    const draft: ResumeDraft = { id: ACTIVE_DRAFT_KEY, markdown, fileName, savedAt };
    const transaction = database.transaction(DRAFT_STORE_NAME, "readwrite");
    transaction.objectStore(DRAFT_STORE_NAME).put(draft);
    await transactionFinished(transaction);
    return draft;
  } finally {
    database.close();
  }
}

export async function loadResumeDraft(): Promise<ResumeDraft | null> {
  const database = await openDraftDatabase();
  try {
    const transaction = database.transaction(DRAFT_STORE_NAME, "readonly");
    const draft = await requestResult(
      transaction.objectStore(DRAFT_STORE_NAME).get(ACTIVE_DRAFT_KEY) as IDBRequest<ResumeDraft | undefined>,
    );
    await transactionFinished(transaction);
    return draft ?? null;
  } finally {
    database.close();
  }
}

export async function deleteResumeDraft(): Promise<void> {
  const database = await openDraftDatabase();
  try {
    const transaction = database.transaction(DRAFT_STORE_NAME, "readwrite");
    transaction.objectStore(DRAFT_STORE_NAME).delete(ACTIVE_DRAFT_KEY);
    await transactionFinished(transaction);
  } finally {
    database.close();
  }
}
