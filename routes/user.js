const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');


router.post('/signUp', function (req, res, next) {
  let db = req.app.locals.db;
  let item = {
    phone: req.body.phone,
    pin: req.body.pin
  }
  const userCollection = db.collection('user');
  const walletCollection = db.collection('wallet');
  userCollection.find({phone: item.phone}).toArray()
    .then(
      result => {
        if (result.length > 0) {
          res.send({code: 0, message: 'Бүртгэлтэй хэрэглэгч байна.'});
        } else {
          let wallet = {
            title: item.phone,
            startBalance: 0,
            currency: 0,
            type: 0,
            isShared: 1,
            walletId: uuidv4().substring(0, 8)
          }
          walletCollection.insertOne(wallet).then(
            walletCollection.find({'walletId': wallet.walletId}).toArray().then(
              walletRes => {
                let wallet = walletRes[0];
                userCollection.insertOne({
                  ...item,
                  wallets: [wallet.walletId],
                  selectedWallet: wallet.walletId
                }).then(
                  response => {
                    res.send({code: 1, message: 'Бүртгэл амжилттай үүслээ.'});
                  })
              }
            )
          )
        }
      })
    .catch(error => {
        res.send({code: 1, message: 'Бүртгэл үүсхэд алдаа гарлаа.'})
        console.error(error)
      }
    )
});

router.post('/changeWallet', function (req, res, next) {
  let db = req.app.locals.db;
  let item = {
    phone: req.body.phone,
    walletId: req.body.walletId,
  }
  const userCollection = db.collection('user');
  const walletCollection = db.collection('wallet');
  userCollection.find({phone: item.phone}).toArray()
    .then(
      result => {
        if (result.length > 0) {
          walletCollection.find({walletId: item.walletId}).toArray()
            .then(walletRes => {
                if (walletRes.length === 0) {
                  res.send({code: 1, message: 'Данс олдсонгүй.'});
                }
                let wallet = walletRes[0];
                userCollection.updateOne({phone: item.phone}, {
                  $set: {selectedWallet: wallet.walletId}
                }).then(
                  response => {
                    res.send({code: 1, message: 'Данс амжилттай солигдлоо.'});
                  })
              }
            )
        } else {
          res.send({code: 1, message: 'Утасны дугаар олдсонгүй.'});
        }
      })
    .catch(error => {
        res.send({code: 0, message: 'Данс солиход алдаа гарлаа.'})
        console.error(error)
      }
    )
});
router.get('/', function (req, res, next) {
  let db = req.app.locals.db;
  let query = req.query;
  const userCollection = db.collection('user');
  userCollection.find(query).toArray()
    .then(
      result => {
        if (result.length > 0) {
          res.send(result[0]);
        } else {
          res.send({code: 0, message: 'Хэрэглэгчийн мэдээлэл олдсонгүй.'});
        }
      })
    .catch(error => {
        res.send({code: 1, message: 'Алдаа гарлаа'})
        console.error(error)
      }
    )
});

router.post('/login', function (req, res, next) {
  let db = req.app.locals.db;
  let item = {
    phone: req.body.phone,
    pin: req.body.pin
  }
  const userCollection = db.collection('user');
  userCollection.find({phone: item.phone, pin: item.pin}).toArray()
    .then(
      result => {
        if (result.length > 0) {
          res.send({code: 1, message: 'Амжилттай.', group: result[0].group});
        } else {
          res.send({code: 0, message: 'Нэвтрэх мэдээлэл буруу байна.'});
        }
      })
    .catch(error => {
        res.send({code: 1, message: 'Амжилтгүй'})
        console.error(error)
      }
    )
});

module.exports = router;
