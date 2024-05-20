import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connected = true;
    this.client.on('error', (err) => {
      console.log(`Redis client not connected to server: ${err}`);
      this.connected = false;
    });
    this.client.get = promisify(this.client.get).bind(this.client);
    this.client.set = promisify(this.client.set).bind(this.client);
    this.client.del = promisify(this.client.del).bind(this.client);
    this.client.ping = promisify(this.client.ping).bind(this.client);
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    let reply;
    try {
      const resp = await this.client.get(key);
      reply = resp;
    } catch (err) {
      console.error(err);
    }
    return reply;
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, 'EX', duration);
    } catch (err) {
      console.error(err);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(err);
    }
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
