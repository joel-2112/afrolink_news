import { Queue } from 'bullmq';
import redis from './redis';

export const analyticsQueue = new Queue('analytics', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Silence BullMQ connection error event emitter to prevent terminal spam
analyticsQueue.on('error', (err) => {
  // We already log a clean single-line warning in redis.ts, so we can ignore this.
});