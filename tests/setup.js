jest.setTimeout(10000);

require('../models/User');

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;  // Tells mongoose to use the global (Node) promise object
mongoose.connect(keys.mongoURI, {useMongoClient: true});

