const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');

const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  // assume the factory will receive a user model
  const sessionObj = {
    passport: {
      user: user._id.toString() // the user._id in mongoose is actually an object
    }
  };

  const sessionString = Buffer.from(JSON.stringify(sessionObj))
    .toString('base64');

  const sig = keygrip.sign('session=' + sessionString);

  return { sessionString, sig }
};