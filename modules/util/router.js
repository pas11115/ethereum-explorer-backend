/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let express = require("express");
let router = express.Router();
let util = require('./controllers/util');

//get api to get all transactions of a address
router.route('^/latest-updated-block$').get(util.latestBlockNumber);


router.route('^/total-transactions$').get(util.totalTransactions);

module.exports = router;
