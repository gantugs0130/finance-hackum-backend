const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const MongoClient = require('mongodb').MongoClient
const transactionRouter = require('./routes/transaction');
const walletRouter = require('./routes/wallet');
const userRouter = require('./routes/user');
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.locals.db = null;

app.use('/transaction', function (req, res, next) {
  if (!app.locals.db) {
    MongoClient.connect('mongodb+srv://hackum:hackum@cluster0.ritcx.mongodb.net/finance?retryWrites=true&w=majority').then(client => {
      app.locals.db = client.db('finance');
      next()
    });
  } else {
    next()
  }
}, transactionRouter);
app.use('/wallet', function (req, res, next) {
  if (!app.locals.db) {
    MongoClient.connect('mongodb+srv://hackum:hackum@cluster0.ritcx.mongodb.net/finance?retryWrites=true&w=majority').then(client => {
      app.locals.db = client.db('finance');
      next()
    });
  } else {
    next()
  }
}, walletRouter);
app.use('/user', function (req, res, next) {
  if (!app.locals.db) {
    MongoClient.connect('mongodb+srv://hackum:hackum@cluster0.ritcx.mongodb.net/finance?retryWrites=true&w=majority').then(client => {
      app.locals.db = client.db('finance');
      next()
    });
  } else {
    next()
  }
}, userRouter);

module.exports = app;
