const express = require('express');
const router = express.Router();
const {v4: uuidv4} = require('uuid');


router.post('/', function (req, res, next) {
  let db = req.app.locals.db;
  let wallet = {
    title: req?.body?.title,
    startBalance: req?.body?.startBalance,
    currency: req?.body?.currency,
    type: req?.body?.type,
    isShared: req?.body?.isShared || 1,
    phone: req?.body?.phone,
    sync: false,
  }
  wallet.walletId = uuidv4().substring(0, 8);
  if (!!wallet.isShared) {
    wallet.password = req?.body?.password;
  }
  if (wallet.startBalance) {
    wallet.balance = wallet.startBalance;
  } else {
    wallet.balance = 0;
  }
  let phone = '';
  if (wallet.phone) {
    phone = wallet.phone
    delete wallet.phone;
  }
  const walletCollection = db.collection('wallet');
  const userCollection = db.collection('user');
  try {
    walletCollection.insertOne(wallet).then(
      result => {
        userCollection.find({'phone': phone}).toArray().then(
          userRes => {
            if (userRes.length > 0) {
              let user = userRes[0];
              let wallets = [];
              if (user.wallets) {
                wallets = user.wallets;
              }
              userCollection.updateOne({phone: phone}, {
                $set: {
                  wallets: [...wallets, wallet.walletId,]
                }
              }).then(
                result => {
                  res.send({code: 1, message: 'Данс амжилттай үүслээ.'});
                })
            }
          }
        )
      })
  } catch (e) {
    res.send({code: 0, message: 'Данс үүсгэхэд алдаа гарлаа.'});
  }


});

module.exports = router;
