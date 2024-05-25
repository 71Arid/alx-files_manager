const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const redisClient = require('../utils/redis');
const mime = require('mime-types');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useUnifiedTopology: true });

class FilesController {
  static async postUpload(req, res) {
    try {
      const {
        name, type, parentId = 0, isPublic, data,
      } = req.body;
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      await client.connect();
      const database = client.db('files_manager');
      const users = database.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      const acceptedTypes = ['folder', 'image', 'file'];
      if (!type || !acceptedTypes.includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if ((type === 'file' || type === 'image') && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }
      let parentDocument = null;
      if (parentId) {
        parentDocument = await database.collection('files').findOne({ _id: new ObjectId(parentId) });
        if (!parentDocument) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentDocument.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
      const fileDocument = {
        userId: user._id,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId !== 0 ? ObjectId(parentId) : 0,
      };
      if (type === 'folder') {
        const result = await database.collection('files').insertOne(fileDocument);
        return res.status(201).json({
          id: result.insertedId,
          userId: fileDocument.userId,
          name: fileDocument.name,
          type: fileDocument.type,
          isPublic: fileDocument.isPublic,
          parentId: fileDocument.parentId,
        });
      }
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const fileUUID = uuid.v4();
      const filePath = path.join(folderPath, fileUUID);
      const fileBuffer = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, fileBuffer);
      fileDocument.localPath = filePath;
      const { localPath, ...newObj } = fileDocument;
      const result = await database.collection('files').insertOne(fileDocument);
      return res.status(201).json({
        id: result.insertedId,
        ...newObj,
      });
    } catch (err) {
      console.error(err);
    }
    return 0;
  }

  static async getShow(req, res) {
    try {
      const { id } = req.params;
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      await client.connect();
      const database = client.db('files_manager');
      const files = database.collection('files');
      const users = database.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userFiles = await files.find({ _id: ObjectId(id), userId: ObjectId(userId) }).toArray();
      if (!userFiles) {
        return res.status(401).json({ error: 'Not found' });
      }
      return res.status(201).json(userFiles);
    } catch (error) {
      console.error(error);
    }
    return 0;
  }

  static async getIndex(req, res) {
    try {
      const parentId = req.query.parentId ? req.query.parentId : '0';
      const page = req.query.page ? parseInt(req.query.page, 10) : 0;
      const pageSize = 20;
      const skip = page * pageSize;

      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      await client.connect();
      const database = client.db('files_manager');
      const files = database.collection('files');
      const users = database.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const query = { userId: new ObjectId(userId) };
      if (parentId !== '0') {
        query.parentId = new ObjectId(parentId);
      } else {
        query.parentId = 0;
      }

      const paginatedFiles = await files.find(query).skip(skip).limit(pageSize).toArray();
      return res.status(200).json(paginatedFiles);
    } catch (error) {
      console.error(error);
    }
    return 0;
  }

  static async putPublish(req, res) {
    try {
      const { id } = req.params;
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      await client.connect();
      const database = client.db('files_manager');
      const files = database.collection('files');
      const users = database.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await files.updateOne(
        { _id: ObjectId(id), userId: ObjectId(userId) }, { $set: { isPublic: true } },
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      const updatedFile = await files.findOne({ _id: new ObjectId(id) });
      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(error);
    }
    return 0;
  }

  static async putUnpublish(req, res) {
    try {
      const { id } = req.params;
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      await client.connect();
      const database = client.db('files_manager');
      const files = database.collection('files');
      const users = database.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await files.updateOne(
        { _id: ObjectId(id), userId: ObjectId(userId) }, { $set: { isPublic: false } },
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      const updatedFile = await files.findOne({ _id: new ObjectId(id) });
      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(error);
    }
    return 0;
  }

  static async getFile(req, res) {
    try {
      const { id } = req.params;
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      await client.connect();
      const database = client.db('files_manager');
      const files = database.collection('files');
      const users = database.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Not found' });
      }
      const userFiles = await files.findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
      if (!userFiles) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (userFiles.type === 'folder') {
        return res.status(400).json({ error: `A folder doesn't have content` });
      }
      if (userFiles.isPublic === false) {
        return res.status(404).json({ error: 'Not found' });
      }
      const filePath = userFiles.localPath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.setHeader('Content-Type', mime.contentType(userFiles.name) || 'text/plain; charset=utf-8');

      const fileContent = fs.readFileSync(filePath);
      res.send(fileContent);
    } catch (error) {
      console.error(error);
    }
    return 0;
  }
}

module.exports = FilesController;
