/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let express = require("express");
let router = express.Router();
let transactionDetails = require('./controllers/transactionDetails');

//post api to get all transactions of a address
router.route('^/transactionDetails$').post(transactionDetails.transactionDetails);
//post api to get all token transactions of a address
router.route('^/tokenTransactionDetails$').post(transactionDetails.tokenTransactionDetails);

module.exports = router;
