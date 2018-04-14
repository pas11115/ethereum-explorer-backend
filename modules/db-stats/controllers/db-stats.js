/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
const projectUtils = require('./../../../projectUtils');

const getDataCount = (db) => {
    return new Promise((resolve, reject) => {
        let count = 1;
        db.createReadStream()
            .on('data', function (data) {
                count++
            })
            .on('error', function (err) {
                reject(err);
            })
            .on('close', function () {
                // console.log('Stream closed')
            })
            .on('end', function () {
                resolve(count);
            });
    })
};

let latestBlockNumber = (req, res) => {
    const db = req.db;
    projectUtils.findLvDb("latestBlockNumber", db.configDb)
        .then((blockNumber) => {
            res.json({latestBlockNumber: blockNumber})
        })
        .catch((err) => {
            console.log(err);
            res.json({error: err.message});
        });
};

let transactionCount = (req, res) => {
    const db = req.db;

    getDataCount(db.transactionDb)
        .then((transactionCount) => {
            res.json({transactionCount});
        })
        .catch((err) => {
            console.log(err);
            return res.json({error: err.message});
        });
};

let accountCount = (req, res) => {
    const db = req.db;

    getDataCount(db.transactionDb)

        .then((accountCount) => {
            res.json({accountCount});
        })
        .catch((err) => {
            console.log(err);
            return res.json({error: err.message});
        });
};

let erc20TokenCount = (req, res) => {
    const db = req.db;

    getDataCount(db.transactionDb)
        .then((erc20TokenCount) => {
            res.json({erc20TokenCount})
        })
        .catch((err) => {
            console.log(err);
            return res.json({error: err.message});
        });
};

let tokenTransactionCount = (req, res) => {
    const db = req.db;

    getDataCount(db.transactionDb)
        .then((tokenTransactionCount) => {
            res.json({tokenTransactionCount})
        })
        .catch((err) => {
            console.log(err);
            return res.json({error: err.message});
        });
};

let tokenAccountCount = (req, res) => {
    const db = req.db;

    getDataCount(db.transactionDb)
        .then((tokenAccountCount) => {
            res.json({tokenAccountCount})
        })
        .catch((err) => {
            console.log(err);
            return res.json({error: err.message});
        });
};

Controller = {
    latestBlockNumber,
    transactionCount,
    accountCount,
    erc20TokenCount,
    tokenTransactionCount,
    tokenAccountCount
};

module.exports = Controller;
