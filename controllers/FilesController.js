const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const redisClient = require('../utils/redis');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useUnifiedTopology: true });

class FilesController {
  static async postUpload(req, res) {
    try {
        const { name , type, parentId = 0, isPublic, data } = req.body;
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
            ...newObj
        });
      } catch (err) {
        console.error(err);
      }
  }
}

module.exports = FilesController;
