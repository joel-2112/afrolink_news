// src/utils/readRateLimit.ts
import redis from '../config/redis';

// spec bonus: prevent same user refreshing and
// generating 100 ReadLog entries in 10 seconds
export const shouldRecordRead = async (
  articleId: string,
  readerId: string | null
): Promise<boolean> => {
  // for guests use IP would be ideal but
  // without IP middleware we use a guest bucket
  const key = readerId
    ? `read:${readerId}:${articleId}`
    : `read:guest:${articleId}`;

  // NX = only set if not exists
  // EX = expire in 60 seconds
  const result = await redis.set(key, '1', 'EX', 60, 'NX');

  // result is 'OK' if key was set (first read)
  // result is null if key already existed (too soon)
  return result === 'OK';
};