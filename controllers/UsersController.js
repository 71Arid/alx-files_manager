const { MongoClient } = require('mongodb');

const crypto = require('crypto');

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

  static hashpassword(password) {
    return crypto.createHash('sha1').update(password).digest('hex');
  }
}

export default UsersController;
