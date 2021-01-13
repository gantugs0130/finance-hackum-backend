var express = require('express');
var router = express.Router();


router.get('/', function (req, res, next) {
  let db = req.app.locals.db;
  if (req.query.type)
    req.query.type = parseInt(req.query.type);
  db.collection('list').find(req.query).sort({"date": -1}).toArray()
    .then(results => {
      results.forEach(item => {
        item.date = formatDate(new Date(item.date), true);
      })
      res.send(results);
    })
    .catch(error => console.error(error))
});


function formatDate(date, noTime = false) {
  let d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;
  let tempDate = [year, month, day].join('-');
  if (noTime) {
    return tempDate;
  }
  return tempDate + 'T00:00:00.000Z';
}

router.get('/today', function (req, res, next) {
  let db = req.app.locals.db;
  let today = new Date();
  let tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 1);
  let tomorrowTime = new Date(formatDate(tomorrow)).getTime() - 8 * 1000 * 60 * 60;
  let todayTime = new Date(formatDate(today)).getTime() - 8 * 1000 * 60 * 60;
  db.collection('list').find({"date": {"$gte": todayTime, "$lt": tomorrowTime}}).sort({"date": -1}).toArray()
    .then(results => {
      results.forEach(item => {
        item.date = formatDate(new Date(item.date), true);
      })
      res.send(results);
    })
    .catch(error => console.error(error))
});

router.get('/lastMonths', function (req, res, next) {
  let db = req.app.locals.db;
  let month = 0;
  if (req.query.type)
    req.query.type = parseInt(req.query.type);
  if (req.query.month)
    month = parseInt(req.query.month);

  let today = new Date();
  let tomorrow = new Date();
  today.setMonth(new Date().getMonth() - month);
  today.setDate(1);
  let thisMonthTime = new Date(formatDate(today)).getTime() - 8 * 1000 * 60 * 60;
  tomorrow.setDate(new Date().getDate() + 1);
  let tomorrowTime = new Date(formatDate(tomorrow)).getTime() - 8 * 1000 * 60 * 60;
  db.collection('list').find({
    "date": {"$gte": thisMonthTime, "$lt": tomorrowTime},
    type: req.query.type
  }).sort({"date": -1}).toArray()
    .then(results => {
      let sum = 0;
      results.forEach(item => {
        item.date = formatDate(new Date(item.date), true);
        sum += item.amount;
      })
      res.send({amount: sum, startDate: formatDate(today, true), endDate: formatDate(tomorrow, true)});
    })
    .catch(error => console.error(error))
});

router.get('/other', function (req, res, next) {
  let db = req.app.locals.db;
  let today = new Date();
  let todayTime = new Date(formatDate(today)).getTime() - 8 * 1000 * 60 * 60;
  db.collection('list').find({"date": {"$lt": todayTime}}).sort({"date": -1}).toArray()
    .then(results => {
      results.forEach(item => {
        item.date = formatDate(new Date(item.date), true);
      })
      res.send(results);
    })
    .catch(error => console.error(error))
});
router.get('/balance', function (req, res, next) {
  let db = req.app.locals.db;
  db.collection('balance').find({'user': 'user'}).toArray()
    .then(results => {
      res.send(results[0]);
    })
    .catch(error => console.error(error))
});


router.post('/', function (req, res, next) {
  let db = req.app.locals.db;
  let item = {
    title: req.body.title,
    amount: req.body.amount,
    type: req.body.type,
    date: Date.now()
  }

  const balanceCollection = db.collection('balance');
  let balance = 0;
  db.collection('balance').find({'user': 'user'}).toArray()
    .then(
      result => {
        if (result.length > 0) {
          balance = result[0].balance;
        }
        if (req.body.type === 0) {
          balance += req.body.amount;
        } else {
          if (balance < req.body.amount) {
            balance = 0;
          } else {
            balance -= req.body.amount;
          }
        }
        if (result.length === 0) {
          balanceCollection.insertOne({user: 'user', balance: balance});
        } else {
          balanceCollection.updateOne({user: 'user'}, {$set: {balance: balance}})
        }
        const list = db.collection('list');
        list.insertOne(item).then(result => {
          res.send(result.ops);
        })
          .catch(error => console.error(error))
      }
    )
    .catch(error => console.error(error))
});

module.exports = router;
