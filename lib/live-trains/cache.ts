
type CachedTrain<T> = {
  data: T;
  fetchedAt: number;
  expiresAt: number;
};

const cache = new Map<string, CachedTrain<unknown>>();

/*
 * Keep this deliberately short while we develop.
 *
 * Later we can tune this based on the provider's
 * update frequency and your monthly API quota.
 */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

function normalizeKey(
  trainNumber: string,
  date?: string | null
) {
  return `${trainNumber.trim()}::${date?.trim() ?? ""}`;
}

export function getCachedTrain<T>(
  trainNumber: string,
  date?: string | null
): {
  data: T;
  fetchedAt: number;
  expiresAt: number;
  stale: boolean;
} | null {
  const key = normalizeKey(
    trainNumber,
    date
  );

  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  const now = Date.now();

  if (now >= cached.expiresAt) {
    cache.delete(key);
    return null;
  }

  return {
    data: cached.data as T,
    fetchedAt: cached.fetchedAt,
    expiresAt: cached.expiresAt,
    stale: false,
  };
}

export function setCachedTrain<T>(
  trainNumber: string,
  data: T,
  date?: string | null,
  ttlMs = DEFAULT_TTL_MS
) {
  const now = Date.now();

  const key = normalizeKey(
    trainNumber,
    date
  );

  cache.set(key, {
    data,
    fetchedAt: now,
    expiresAt: now + ttlMs,
  });
}

export function clearCachedTrain(
  trainNumber: string,
  date?: string | null
) {
  cache.delete(
    normalizeKey(trainNumber, date)
  );
}

export function clearAllTrainCache() {
  cache.clear();
}