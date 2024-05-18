import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    const client = redis.createClient('redis://127.0.0.1:6379')
      .on('error', (err) => console.log(`Redis client not connected to server: ${err}`));
    client.get = promisify(client.get).bind(client);
    client.set = promisify(client.set).bind(client);
    client.del = promisify(client.del).bind(client);
    client.save();
    this.redcli = client;
  }

  isAlive() {
    try {
      this.redcli.ping();
      return true;
    } catch (err) {
      console.error(err);
    }
    return false;
  }

  async get(key) {
    let reply;
    try {
      const resp = await this.redcli.get(key);
      reply = resp;
    } catch (err) {
      console.error(err);
    }
    return reply;
  }

  async set(key, value, duration) {
    try {
      await this.redcli.set(key, value, 'EX', duration);
    } catch (err) {
      console.error(err);
    }
  }

  async del(key) {
    try {
      await this.redcli.del(key);
    } catch (err) {
      console.error(err);
    }
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
