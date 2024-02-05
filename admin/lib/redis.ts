import { RedisClientType, createClient } from 'redis';

function connect(): RedisClientType {
  return createClient({ url: 'redis://localhost:6379' });
}

export const client: RedisClientType = connect();

export async function getClient() {
  if (!client.isReady) await client.connect();
  return client;
}

