require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb+srv://aavishkark_db_user:VTxqaDb1xOCy25QI@cluster0.lh1frcx.mongodb.net/?appName=Cluster0";

const connection = mongoose.connect(mongoURI);

module.exports = {
  connection,
};