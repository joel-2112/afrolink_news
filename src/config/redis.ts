import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required by BullMQ
  retryStrategy(times) {
    // Slow down reconnection attempts to once every 10 seconds to prevent spamming
    return 10000;
  },
});

redis.on('connect', () => console.log('Redis connected'));

// Silence spammy AggregateError/ECONNREFUSED stack traces with a clean single-line alert
let warningLogged = false;
redis.on('error', (err) => {
  if (err.message?.includes('ECONNREFUSED') || (err as any).code === 'ECONNREFUSED') {
    if (!warningLogged) {
      console.warn('⚠️  Redis is offline. Background queues (BullMQ) will not work until Redis is started on 6379.');
      warningLogged = true;
    }
  } else {
    console.error('Redis error:', err.message || err);
  }
});

export default redis;