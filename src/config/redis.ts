import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, 
  retryStrategy(times) {
    
    return 10000;
  },
});

redis.on('connect', () => console.log('Redis connected'));

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