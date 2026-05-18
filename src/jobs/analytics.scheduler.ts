import { Queue } from 'bullmq';
import redis from '../config/redis';

const schedulerQueue = new Queue('analytics', { connection: redis });

schedulerQueue.on('error', (err) => {
  
});

export const scheduleAnalyticsJob = async () => {
  
  
  const repeatableJobs = await schedulerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await schedulerQueue.removeRepeatableByKey(job.key);
  }

  
  await schedulerQueue.add(
    'daily-aggregate',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: {
        pattern: '0 0 * * *',   
        tz: 'GMT',
      },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,            
      },
    }
  );

  console.log('[Analytics Scheduler] Daily job scheduled at 00:00 GMT');
};