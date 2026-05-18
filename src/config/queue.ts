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

analyticsQueue.on('error', (err) => {
  
});