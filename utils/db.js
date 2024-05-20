import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${dbHost}:${dbPort}`;
    const client = new MongoClient(url, { useUnifiedTopology: true });
    (async () => {
      try {
        await client.connect();
        this.connected = true;
        this.db = client.db(database);
      } catch (error) {
        console.error(error);
      }
    })();
    this.connected = false;
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    let count = 0;
    try {
      const collection = await this.db.collection('users');
      count = await collection.countDocuments();
    } catch (error) {
      console.error(error);
    }
    return count;
  }

  async nbFiles() {
    let count = 0;
    try {
      const collection = await this.db.collection('files');
      count = await collection.countDocuments();
    } catch (error) {
      console.error(error);
    }
    return count;
  }
}

const dbClient = new DBClient();

export default dbClient;
