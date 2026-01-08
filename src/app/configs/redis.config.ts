/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all lint/suspicious/noExplicitAny: > */
import { createClient, RedisClientType } from "redis";

import { envVars } from "./envVars";

let redis: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (!redis) {
    redis = createClient({
      username: envVars.REDIS.REDIS_USERNAME,
      password: envVars.REDIS.REDIS_PASSWORD,
      socket: {
        host: envVars.REDIS.REDIS_HOST,
        port: Number(envVars.REDIS.REDIS_PORT),
      },
    });

    redis.on("error", (err) => {
      console.error("Redis Client Error", err);
      redis = null; // force reconnect next time
    });
  }

  if (!redis.isOpen) {
    await redis.connect();
  }

  return redis;
}


// /* eslint-disable no-console */
// /** biome-ignore-all lint/suspicious/noExplicitAny: > */
// import { createClient } from 'redis';
// import { envVars } from './envVars';

export const redisClient = createClient({
    username: envVars.REDIS.REDIS_USERNAME,
    password: envVars.REDIS.REDIS_PASSWORD,
    socket: {
        host: envVars.REDIS.REDIS_HOST,
        port: Number(envVars.REDIS.REDIS_PORT)
    }
});

redisClient.on('error', (err: any) => console.log('Redis Client Error', err));


// // await redisClient.set('foo', 'bar');
// // const result = await redisClient.get('foo');
// // console.log(result)  // >>> bar


export const connectRedis = async()=>{
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("Redis Successfully connected");
    }
}

// // redis.ts
// export const getRedis = async () => {
//   if (!redisClient.isOpen) {
//     await redisClient.connect()
//     console.log("Redis connected")
//   }
//   return redisClient
// }
