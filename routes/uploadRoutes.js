const aws = require('aws-sdk');
const uuid = require('uuid/v1');
const requireLogin = require('../middlewares/requireLogin');
const keys = require('../config/keys');

const s3 = new aws.S3({
  accessKeyId: keys.AccessKeyId,
  secretAccessKey: keys.SecretAccessKey,
  signatureVersion: 'v4',
  region: 'eu-west-3'
});

module.exports = (app) => {
  app.get('/api/upload', requireLogin, (req, res) => {
    const key = `${req.user.id}/${uuid()}.jpeg`;

    s3.getSignedUrl('putObject', {
      Bucket: 'blinds-node-blog',
      Key: key,
      ContentType: 'image/jpeg'
    }, (err, url) => res.send({ key, url }));
  })
};