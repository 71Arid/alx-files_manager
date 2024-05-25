const Bull = require('bull');
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const imageThumbnail = require('image-thumbnail');

const fileQueue = new Bull('fileQueue', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useUnifiedTopology: true });

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  await client.connect();
  const database = client.db('files_manager');
  const files = database.collection('files');
  const fileDocument = await files.findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });

  if (!fileDocument) throw new Error('File not found');

  const filePath = fileDocument.localPath;
  const sizes = [100, 250, 500];

  for (const size of sizes) {
    const options = { width: size };
    const thumbnail = await imageThumbnail(filePath, options);
    const thumbnailPath = `${filePath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnail);
  }
});
