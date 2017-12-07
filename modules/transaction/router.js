/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let express = require("express");
let router = express.Router();
let transactionDeatils = require('./controllers/transactionDeatils');

router.route('^/transactionDeatils$').post(transactionDeatils.transactionDeatils);

module.exports = router;
