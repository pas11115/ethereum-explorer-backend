/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
const express = require("express");
const router = express.Router();
const transactionHistory = require('./controllers/transactionHistory');

//get api to get all transactions of a address
router.route('^/transactionHistory/:address/:pageNumber$').get(transactionHistory.transactionHistory);

//get api to get all token transactions of a address
router.route('^/tokenTransactionHistory/:address/:pageNumber$').get(transactionHistory.tokenTransactionHistory);

//
router.route('^/accountTransactionCount/:address$').get(transactionHistory.accountTransactionCount);


module.exports = router;
