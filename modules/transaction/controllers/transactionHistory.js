/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
const ethers = require('ethers');
const utils = ethers.utils;

const projectUtils = require('./../../../projectUtils');

const transactionHistory = (req, res) => {
    const db = req.db;
    let address = req.params.address;
    let pageNumber = req.params.pageNumber;

    if (!address)
        return res.json({success: false, msg: "Address can't be null."});

    //validate address and getChecksumAddress
    try {
        address = utils.getAddress(address);
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }

    if (!pageNumber)
        pageNumber = 1;

    let limit = 50;
    let skip = limit * (pageNumber - 1);
    let transactions = [];

    projectUtils.findLvDb(address, db.accountDb)
        .then((transactionsHash) => {
            if (!transactionsHash)
                throw Error("noTransactionsFound");

            transactionsHash = transactionsHash.split(',');

            if (transactionsHash.length < limit)
                limit = transactionsHash.length;

            limit = skip + limit;

            if (limit > transactionsHash.length)
                return res.json({
                    success: false,
                    msg: "No transactions found for " + address + " at page no " + pageNumber + "."
                });

            for (let i = skip; i < limit; i++) {
                projectUtils.findLvDb(transactionsHash[i], db.transactionDb)
                    .then((transaction) => {
                        if (transaction)
                            transactions.push(JSON.parse(transaction));
                        if (i + 1 === limit)
                            res.json({
                                success: true,
                                transactions: transactions,
                                transactionsCount: transactionsHash.length
                            });
                    })
            }
        })
        .catch((err) => {
            if (err.message === "noTransactionsFound")
                res.json({success: false, msg: "No transactions found on address " + address});
        });
};

const tokenTransactionHistory = (req, res) => {
    const db = req.db;
    let address = req.params.address;
    let pageNumber = req.params.pageNumber;

    if (!address)
        return res.json({success: false, msg: "Address can't be null."});

    //validate address and getChecksumAddress
    try {
        address = utils.getAddress(address);
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }

    if (!pageNumber)
        pageNumber = 1;

    let limit = 50;
    let skip = limit * (pageNumber - 1);
    let transactions = [];

    projectUtils.findLvDb(address, db.tokenAccountDb)
        .then((transactionsHash) => {
            if (!transactionsHash)
                throw Error("noTransactionsFound");

            transactionsHash = transactionsHash.split(',');

            if (transactionsHash.length < limit)
                limit = transactionsHash.length;

            limit = skip + limit;

            if (limit > transactionsHash.length)
                return res.json({
                    success: false,
                    msg: "No transactions found for " + address + " at page no " + pageNumber + "."
                });

            for (let i = skip; i < limit; i++) {
                projectUtils.findLvDb(transactionsHash[i], db.transactionDb)
                    .then((transaction) => {
                        if (transaction)
                            transactions.push(JSON.parse(transaction));
                        if (i + 1 === limit)
                            res.json({
                                success: true,
                                transactions: transactions,
                                transactionsCount: transactionsHash.length
                            });
                    })
            }
        })
        .catch((err) => {
            if (err.message === "noTransactionsFound")
                res.json({success: false, msg: "No transactions found on address " + address});
        });
};

const accountTransactionCount = (req, res) => {
    const db = req.db;
    let address = req.params.address;

    if (!address)
        return res.json({success: false, msg: "Address can't be null."});

    //validate address and getChecksumAddress
    try {
        address = utils.getAddress(address);
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }

    let transactionCount = 0;
    let tokenTransactionCount = 0;

    // get transaction count of particular address in token and transaction db
    projectUtils.findLvDb(address, db.accountDb)
        .then((transactions) => {
            if (transactions) {
                transactions = transactions.split(',');
                transactionCount = transactions.length;
            }
        })
        .then((tokenTransaction) => {
            if (tokenTransaction) {
                tokenTransaction = tokenTransaction.split(',');
                tokenTransactionCount = tokenTransaction.length;
            }
            res.json({success: true, transactionCount, tokenTransactionCount});
        })
        .catch((err) => {
            return res.json({success: false, msg: "Error while getting transaction count.", error: err.message});
        });
};

Controller = {
    transactionHistory,
    tokenTransactionHistory,
    accountTransactionCount
};

module.exports = Controller;
