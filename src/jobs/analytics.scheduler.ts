import { Queue } from 'bullmq';
import redis from '../config/redis';

const schedulerQueue = new Queue('analytics', { connection: redis });

schedulerQueue.on('error', (err) => {
  // Silence connection errors as they are handled in redis.ts
});

export const scheduleAnalyticsJob = async () => {
  // remove any existing repeatable jobs first
  // prevents duplicate schedules on server restart
  const repeatableJobs = await schedulerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await schedulerQueue.removeRepeatableByKey(job.key);
  }

  // schedule daily at midnight GMT — spec requires GMT
  await schedulerQueue.add(
    'daily-aggregate',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: {
        pattern: '0 0 * * *',   // every day at 00:00 GMT
        tz: 'GMT',
      },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,            // 5s → 10s → 20s
      },
    }
  );

  console.log('[Analytics Scheduler] Daily job scheduled at 00:00 GMT');
};