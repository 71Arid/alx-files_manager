const { MongoClient } = require('mongodb');
const { Buffer } = require('buffer');
const uuid = require('uuid');
const redisClient = require('../utils/redis');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useUnifiedTopology: true });

class AuthController {
  static async getConnect(req, res) {
    const { authorization } = req.headers;
    let setToken;
    try {
      const emailToken = AuthController.base64encode(authorization);
      const [email, password] = emailToken.split(':');
      if (!email || !password) {
        throw new Error('Invalid authorization format');
      }
      await client.connect();
      const database = client.db('files_manager');
      const users = database.collection('users');
      const user = await users.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uuid.v4();
      const key = `auth_${token}`;
      await redisClient.set(key, `${user._id}`, 86400);
      setToken = token;
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ token: `${setToken}` });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const redisToken = await redisClient.get(`auth_${token}`);
    if (redisToken) {
      await redisClient.del(`auth_${token}`);
      return res.status(204).json();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  static base64encode(authorization) {
    const startStr = 'Basic ';
    if (authorization.startsWith(startStr)) {
      const decodedStr = Buffer.from(authorization.slice(6), 'base64').toString();
      return decodedStr;
    }
    throw new Error('no Basic in header');
  }
}

export default AuthController;
