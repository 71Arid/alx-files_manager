const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');
const redisClient = require('../utils/redis');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useUnifiedTopology: true });

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    let newUser;
    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    try {
      await client.connect();
      const database = client.db('files_manager');
      const users = database.collection('users');
      const user = await users.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'Already exists' });
      }
      const pwd = UsersController.hashpassword(password);
      const result = await users.insertOne({ email, password: pwd });
      const { insertedId } = result;
      newUser = { id: insertedId, email };
    } catch (error) {
      console.error(error);
    }
    return res.status(201).json(newUser);
  }

  static async getMe(req, res) {
    let foundUser;
    try {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      await client.connect();
      const database = client.db('files_manager');
      const users = database.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      foundUser = user;
    } catch (err) {
      console.error(err);
    }
    return res.status(200).json({ id: foundUser._id, email: foundUser.email });
  }

  static hashpassword(password) {
    return crypto.createHash('sha1').update(password).digest('hex');
  }
}

export default UsersController;
