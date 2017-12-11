/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let express = require("express");
let router = express.Router();
let transactionDetails = require('./controllers/transactionDetails');

router.route('^/transactionDetails$').post(transactionDetails.transactionDetails);
router.route('^/tokenTransactionDetails$').post(transactionDetails.tokenTransactionDetails);

module.exports = router;
