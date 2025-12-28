import { createClient, RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null

/**
 * Get or create Redis client instance
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })

    redisClient.on('error', (err) => console.error('Redis Client Error', err))
    redisClient.on('connect', () => console.log('Redis Client Connected'))

    await redisClient.connect()
  }

  return redisClient
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}

/**
 * Cache data with TTL (Time To Live)
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  const client = await getRedisClient()
  await client.setEx(key, ttlSeconds, JSON.stringify(value))
}

/**
 * Get cached data
 * @param key - Cache key
 * @returns Cached value or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = await getRedisClient()
  const value = await client.get(key)

  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error('Error parsing cached value:', error)
    return null
  }
}

/**
 * Delete cache entry
 * @param key - Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  const client = await getRedisClient()
  await client.del(key)
}

/**
 * Delete multiple cache entries by pattern
 * @param pattern - Pattern to match (e.g., "hotels:*")
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = await getRedisClient()
  const keys = await client.keys(pattern)

  if (keys.length > 0) {
    await client.del(keys)
  }
}

/**
 * Set a distributed lock with expiration
 * Used for preventing race conditions (e.g., double bookings)
 * @param key - Lock key
 * @param ttlSeconds - Lock expiration time
 * @returns true if lock acquired, false if already locked
 */
export async function acquireLock(
  key: string,
  ttlSeconds: number = 600
): Promise<boolean> {
  const client = await getRedisClient()
  const lockKey = `lock:${key}`

  // SET NX (only if not exists) with expiration
  const result = await client.set(lockKey, Date.now().toString(), {
    NX: true,
    EX: ttlSeconds,
  })

  return result === 'OK'
}

/**
 * Release a distributed lock
 * @param key - Lock key
 */
export async function releaseLock(key: string): Promise<void> {
  const client = await getRedisClient()
  const lockKey = `lock:${key}`
  await client.del(lockKey)
}

/**
 * Check if a lock exists
 * @param key - Lock key
 * @returns true if locked, false otherwise
 */
export async function isLocked(key: string): Promise<boolean> {
  const client = await getRedisClient()
  const lockKey = `lock:${key}`
  const exists = await client.exists(lockKey)
  return exists === 1
}

/**
 * Increment a counter (useful for rate limiting)
 * @param key - Counter key
 * @param ttlSeconds - TTL for the counter (optional)
 * @returns Current count after increment
 */
export async function incrementCounter(
  key: string,
  ttlSeconds?: number
): Promise<number> {
  const client = await getRedisClient()
  const count = await client.incr(key)

  // Set expiration on first increment
  if (count === 1 && ttlSeconds) {
    await client.expire(key, ttlSeconds)
  }

  return count
}

/**
 * Get counter value
 * @param key - Counter key
 * @returns Current count or 0 if not found
 */
export async function getCounter(key: string): Promise<number> {
  const client = await getRedisClient()
  const value = await client.get(key)
  return value ? parseInt(value, 10) : 0
}

/**
 * Reset counter
 * @param key - Counter key
 */
export async function resetCounter(key: string): Promise<void> {
  const client = await getRedisClient()
  await client.del(key)
}

// Export commonly used cache TTLs
export const CACHE_TTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
}
