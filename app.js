const path = require('path');
const express = require('express');
const app = express();
const feedRoutes = require('./routes/feedRoutes');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
//Parser for x-www-form-urlencoded data
//app.use(bodyParser.urlencoded())

//REISTER Parser for JSON data
app.use(bodyParser.json());

//REGISTER MULTER for Files uploads/downloads
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
//Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

//ROUTES
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

//ERROR HANDLER
app.use((err, req, res, next) => {
  console.log(err);
  const status = err.statusCode || 500;
  const message = err.message;
  const data = err.data;
  res.status(status).json({ message: message, data: data });
});

//CONNECTION AND RUN SERVER
mongoose
  .connect('mongodb://fdiaz:Lamara777@ds151416.mlab.com:51416/node_api', {
    useNewUrlParser: true
  })
  .then(result => {
    const server = app.listen(8080);
    const io = require('./socket').init(server);
    io.on('connection', socket => {
      console.log('Cliente Connection');
    });
  });
