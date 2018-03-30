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

let totalTransactions = (req, res) => {
    const db = req.db;
    let transactionCount, accountCount, erc20TokenCount, tokenTransactionCount, tokenAccountCount;

    getDataCount(db.transactionDb)
        .then((_transactionCount) => {
            transactionCount = _transactionCount;
            return getDataCount(db.accountDb)
        })
        .then((_accountCount) => {
            accountCount = _accountCount;
            return getDataCount(db.erc20TokenDb)
        })
        .then((_erc20TokenCount) => {
            erc20TokenCount = _erc20TokenCount;
            return getDataCount(db.tokenTransactionDb);
        })
        .then((_tokenTransactionCount) => {
            tokenTransactionCount = _tokenTransactionCount;
            return getDataCount(db.tokenAccountDb)
        })
        .then((_tokenAccountCount) => {
            tokenAccountCount = _tokenAccountCount;
            return projectUtils.findLvDb("latestBlockNumber", db.configDb)
        })
        .then((latestBlockNumber) => {
            res.json({
                transactionCount,
                accountCount,
                erc20TokenCount,
                tokenTransactionCount,
                tokenAccountCount,
                latestBlockNumber
            })
        })
        .catch((err) => {
            console.log(err);
            return res.json({error: err.message});
        });
};

Controller = {
    latestBlockNumber,
    totalTransactions
};

module.exports = Controller;
