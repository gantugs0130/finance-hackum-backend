var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const MongoClient = require('mongodb').MongoClient
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/finance');
var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.locals.db = null;

app.use('/', indexRouter);
app.use('/list', function (req, res, next) {
  if (!app.locals.db) {
    MongoClient.connect('mongodb+srv://hackum:hackum@cluster0.ritcx.mongodb.net/finance?retryWrites=true&w=majority').then(client => {
      app.locals.db = client.db('finance');
      next()
    });
  } else {
    next()
  }
}, usersRouter);

module.exports = app;
