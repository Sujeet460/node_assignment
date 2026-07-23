import { createClient } from "redis";
import redisConfig from "../config/redis.js";

let redisClient = null;
let isRedisConnected = false;

// In-memory cache fallback store
const memoryCache = new Map();

const initCache = async () => {
  const redisUrl = redisConfig.url;
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: () => false // Do not retry, fail fast
      }
    });
    
    redisClient.on("error", (err) => {
      // Catch errors silently to prevent application crashes, setting status to false
      console.warn("Redis client error connection log:", err.message);
      isRedisConnected = false;
    });

    await redisClient.connect();
    console.log("Connected to Redis cache successfully");
    isRedisConnected = true;
  } catch (error) {
    console.warn("Could not connect to Redis. Using in-memory cache fallback.", error.message);
    isRedisConnected = false;
    redisClient = null;
  }
};

const get = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Redis get error:", err);
    }
  }

  // Memory fallback logic
  const cached = memoryCache.get(key);
  if (cached) {
    if (cached.expiry && Date.now() > cached.expiry) {
      memoryCache.delete(key);
      return null;
    }
    return cached.value;
  }
  return null;
};

const set = async (key, value, ttlSeconds = 3600) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
      return;
    } catch (err) {
      console.error("Redis set error:", err);
    }
  }

  // Memory fallback logic
  const expiry = Date.now() + ttlSeconds * 1000;
  memoryCache.set(key, { value, expiry });
};

const del = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      console.error("Redis delete error:", err);
    }
  }

  // Memory fallback logic
  memoryCache.delete(key);
};

const flush = async () => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.flushDb();
      return;
    } catch (err) {
      console.error("Redis flush error:", err);
    }
  }

  // Memory fallback logic
  memoryCache.clear();
};

export { initCache, get, set, del, flush, isRedisConnected };
