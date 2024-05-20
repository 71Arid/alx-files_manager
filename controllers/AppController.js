import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(_req, res) {
    if (dbClient.isAlive() && redisClient.isAlive()) {
      res.status(200).json({ redis: true, db: true });
    }
  }

  static async getStats(_req, res) {
    if (dbClient.isAlive()) {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();
      res.json({ users: `${users}`, files: `${files}` });
    }
  }
}

export default AppController;
