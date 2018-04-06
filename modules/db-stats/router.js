/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let express = require("express");
let router = express.Router();
let dbStats = require('./controllers/db-stats');

router.route('^/block$').get(dbStats.latestBlockNumber);
router.route('^/transaction$').get(dbStats.transactionCount);
router.route('^/account$').get(dbStats.accountCount);
router.route('^/erc20$').get(dbStats.erc20TokenCount);
router.route('^/token-transaction$').get(dbStats.tokenTransactionCount);
router.route('^/token-account$').get(dbStats.tokenAccountCount);

module.exports = router;