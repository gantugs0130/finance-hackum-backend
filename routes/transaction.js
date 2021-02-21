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
  let query = req.query;
  let db = req.app.locals.db;
  let today = new Date();
  let tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 1);
  today.setSeconds(0);
  today.setMinutes(0);
  today.setHours(0);
  tomorrow.setMinutes(0);
  tomorrow.setSeconds(0);
  tomorrow.setHours(0);
  db.collection('list').find({
    ...query,
    "date": {
      "$gte": today.getTime(),
      "$lt": tomorrow.getTime()
    }
  }).sort({"date": -1}).toArray()
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
  today.setDate(0);
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  tomorrow.setDate(new Date().getDate() + 1);
  tomorrow.setMinutes(0);
  tomorrow.setSeconds(0);
  tomorrow.setHours(0);
  let query = {
    "date": {"$gte": today.getTime(), "$lt": tomorrow.getTime()},
    type: req.query.type
  };
  if (req?.query?.phone) {
    query.phone = req.query.phone;
  }
  if (req?.query?.group) {
    query.group = req.query.group;
  }

  db.collection('list').find(query).sort({"date": -1}).toArray()
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
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  let query = {"date": {"$lt": today.getTime()}};
  if (req.query.phone) {
    query.phone = req.query.phone;
  }
  if (req.query.group) {
    query.group = req.query.group;
  }
  db.collection('list').find(query).sort({"date": -1}).toArray()
    .then(results => {
      results.forEach(item => {
        item.date = formatDate(new Date(item.date), true);
      })
      res.send(results);
    })
    .catch(error => console.error(error))
});

router.post('/', function (req, res, next) {
  let db = req.app.locals.db;
  let item = {
    transactionId: req?.body?.transactionId,
    title: req?.body?.title,
    amount: parseInt(req?.body?.amount),
    type: req?.body?.type,
    date: Date.now(),
    phone: req?.body?.phone,
    walletId: req?.body?.walletId,
    editedAt: Date.now(),
    sync: false,
  }
  const transactionCollection = db.collection('transaction');
  const walletCollection = db.collection('wallet');
  transactionCollection.find({transactionId: item.transactionId}).toArray.then(
    tranRes => {
      if (tranRes.length !== 0) {
        res.send({code: 0, message: 'Гүйлгээний дугаар буруу байна.'});
      }
      walletCollection.find({walletId: item.walletId}).toArray().then(
        walletRes => {
          let wallet = walletRes[0];
          let balance = parseInt(wallet.balance);
          if (item.type.toString() === '0') {
            balance += item.amount;
          } else {
            balance -= item.amount;
          }
          walletCollection.updateOne({walletId: item.walletId}, {
            $set: {
              balance: balance
            }
          })
          transactionCollection.insertOne(item);
          res.send({code: 1, message: 'Гүйлгээ амжилттай.'});
        }
      )
    }
  )
    .catch(error => console.error(error))
});
router.post('/delete', function (req, res, next) {
  let db = req.app.locals.db;
  let item = {
    transactionId: req?.body?.transactionId,
    editedAt: Date.now(),
    sync: false,
    deleted: true
  }
  const transactionCollection = db.collection('transaction');
  const walletCollection = db.collection('wallet');
  transactionCollection.find({transactionId: item.transactionId}).toArray().then(
    tranRes => {
      if (tranRes.length === 0) {
        res.send({code: 0, message: 'Гүйлгээний дугаар буруу байна.'});
      }
      let transaction = tranRes[0];
      let tAmount = 0;
      if (transaction.type.toString() === '0') {
        tAmount = -parseInt(transaction.amount);
      } else {
        tAmount = parseInt(transaction.amount);
      }
      transactionCollection.updateOne({transactionId: item.transactionId}, {
        $set: {
          ...item
        }
      })
      let balance = tAmount;
      walletCollection.find({walletId: transaction.walletId}).toArray().then(
        walletRes => {
          let wallet = walletRes[0];
          balance += parseInt(wallet.balance);
          walletCollection.updateOne({walletId: transaction.walletId}, {
            $set: {
              balance: balance
            }
          })
          res.send({code: 1, message: 'Гүйлгээ амжилттай засварлагдлаа.'});
        }
      )
    }
  ).catch(error => console.error(error))
})
router.post('/update', function (req, res, next) {
  let db = req.app.locals.db;
  let item = {
    transactionId: req?.body?.transactionId,
    title: req?.body?.title,
    amount: parseInt(req?.body?.amount),
    type: req?.body?.type,
    editedAt: Date.now(),
    sync: false,
  }
  const transactionCollection = db.collection('transaction');
  const walletCollection = db.collection('wallet');
  transactionCollection.find({transactionId: item.transactionId}).toArray().then(
    tranRes => {
      if (tranRes.length === 0) {
        res.send({code: 0, message: 'Гүйлгээний дугаар буруу байна.'});
      }
      let transaction = tranRes[0];
      let tAmount = 0;
      if (item.type.toString() === '0' && transaction.type.toString() === '0') {
        tAmount = item.amount - parseInt(transaction.amount);
      } else if (item.type.toString() === '0' && transaction.type.toString() === '1') {
        tAmount = parseInt(transaction.amount) + item.amount;
      } else if (item.type.toString() === '1' && transaction.type.toString() === '1') {
        tAmount = parseInt(transaction.amount) - item.amount;
      } else {
        tAmount = -(item.amount + parseInt(transaction.amount));
      }
      transactionCollection.updateOne({transactionId: item.transactionId}, {
        $set: {
          ...item
        }
      })
      let balance = tAmount;
      walletCollection.find({walletId: transaction.walletId}).toArray().then(
        walletRes => {
          let wallet = walletRes[0];
          balance += parseInt(wallet.balance);
          walletCollection.updateOne({walletId: transaction.walletId}, {
            $set: {
              balance: balance
            }
          })
          res.send({code: 1, message: 'Гүйлгээ амжилттай засварлагдлаа.'});
        }
      )
    }
  ).catch(error => console.error(error))
})
module.exports = router;
