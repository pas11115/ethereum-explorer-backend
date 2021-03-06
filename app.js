/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
// BASE SETUP
// =============================================================================
// import the packages we need
const express = require('express');                   //import express module
const bodyParser = require('body-parser');            //import bodyparser
const app = express();                                //import express contractor
const cors = require('cors');                         //import cors for cross domain requestconst config = require('./config');                   //import config
const config = require('./config');
const morgan = require('morgan');
const transactionsCron = require('./crons/transactions');
// configure cors
app.use(cors());

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :date[clf]'));

// configure body parser
app.use(bodyParser.urlencoded({limit: '5mb', extended: true}));
app.use(bodyParser.json({limit: '5mb', extended: true}));

const levelUp = require('levelup');
const levelDown = require('leveldown');

// 1) Create our store
const configDb = levelUp(levelDown(config.dbPath + '/configs'));
const transactionDb = levelUp(levelDown(config.dbPath + '/transactions'));
const accountDb = levelUp(levelDown(config.dbPath + '/accounts'));
const erc20TokenDb = levelUp(levelDown(config.dbPath + '/erc20-tokens'));
const tokenTransactionDb = levelUp(levelDown(config.dbPath + '/token-transactions'));
const tokenAccountDb = levelUp(levelDown(config.dbPath + '/token-accounts'));
let db = {configDb, transactionDb, accountDb, erc20TokenDb, tokenTransactionDb, tokenAccountDb};

// ROUTES FOR OUR API
// =============================================================================
// create our router
const router = express.Router();

// middleware to use for all requests
router.use((req, res, next) => {

    //pass database on every request call
    req.db = db;
    next();
});

// import our routers
// ----------------------------------------------------
router.use('/transaction', require('./modules/transaction/router'));
router.use('/db-stats', require('./modules/db-stats/router'));

// register our routers
// -------------------------------
app.use('/api', router);

// Start cron job to get transactions form every block
transactionsCron.getTransactions(db);

// START THE SERVER
// =============================================================================
app.listen(process.env.PORT || config.port, (err) => {
    if (err)
        console.log(err);
    console.log('Server running at port:' + config.port);
});