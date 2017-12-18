/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let express = require("express");
let router = express.Router();
let transactionHistory = require('./controllers/transactionHistory');

//post api to get all transactions of a address
router.route('^/transactionHistory/:address$').get(transactionHistory.transactionHistory);

router.route('^/transactionHistory1/:address$').get(transactionHistory.transactionHistory1);
router.route('^/transactionHistory2/:address$').get(transactionHistory.transactionHistory2);
router.route('^/transactionHistory3/:address$').get(transactionHistory.transactionHistory3);

//post api to get all token transactions of a address
router.route('^/tokenTransactionHistory/:address$').get(transactionHistory.tokenTransactionHistory);

module.exports = router;
