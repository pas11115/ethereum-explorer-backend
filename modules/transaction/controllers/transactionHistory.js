/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let ethers = require('ethers');
let utils = ethers.utils;
let Transaction = require('../../../models/transactionModel');
let TokenTransaction = require('../../../models/tokenTransactionModel');
let projectUtils = require('./../../../projectUtils');

let transactionHistory = (req, res) => {
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


    let select = 'hash blockNumber timestamp from to isContractCreation value txtFee isErc20Token';

    //find 'from' or 'to' transactions of address
    Transaction.find({$or: [{from: address}, {to: address}]}).select(select).sort({'timestamp': -1}).skip(skip).limit(limit).lean()
        .then((transactions) => {
            res.json({success: true, transactions: transactions});
        })
        .catch((error) => {
            res.json({success: false, msg: "Error while getting transactions.", error: error.message});
        });

    /*
    let allTransactions = [];

    //find 'from' transactions of address
    Transaction.find({from: address}).select(select).lean()
        .then((fromTransactions) => {
            if (!fromTransactions.length)
                return "No transaction in from";
            //type:out inject in 'from' all transactions
            return projectUtils.injectKeyValueInArray(fromTransactions, {type: 'out', isPending: false})
        })
        .then((outTransactions) => {
            if (outTransactions !== "No transaction in from")
                allTransactions = outTransactions;
            //find 'to' transactions of address
            return Transaction.find({to: address}).select(select).lean();
        })
        .then((toTransactions) => {
            if (!toTransactions.length) {
                // sort transactions in descending order of timestamp
                if (allTransactions.length)
                    allTransactions = allTransactions.sort(function (a, b) {
                        return new Date(b.timestamp) - new Date(a.timestamp);
                    });

                //skip and limit on array
                allTransactions = allTransactions.slice(skip,skip+limit);

                res.json({success: true, transactions: allTransactions});
                throw 'Returned';
            }
            //type:in inject in 'to' all transactions
            return projectUtils.injectKeyValueInArray(toTransactions, {type: 'in', isPending: false})
        })
        .then((inTransactions) => {
            allTransactions = allTransactions.concat(inTransactions);
            // sort transactions in descending order of timestamp
            allTransactions = allTransactions.sort(function (a, b) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });

            //skip and limit on array
            allTransactions = allTransactions.slice(skip,skip+limit);

            return res.json({success: true, transactions: allTransactions});
        })
        .catch((error) => {
            if (error !== 'Returned')
                return res.json({success: false, msg: "Error while getting transactions.", error: error.message});
        });*/
};

let tokenTransactionHistory = (req, res) => {
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

    //find 'from' or 'to' transactions of address
    Transaction.find({$or: [{from: address}, {to: address}]}).select(select).sort({'timestamp': -1}).skip(skip).limit(limit).lean()
        .then((transactions) => {
            res.json({success: true, transactions: transactions});
        })
        .catch((error) => {
            res.json({success: false, msg: "Error while getting transactions.", error: error.message});
        });

    /*let allTransactions = [];

    //find 'from' transactions of address
    TokenTransaction.find({from: address}).lean()
        .then((fromTransactions) => {
            if (!fromTransactions.length)
                return "No transaction in from";
            //type:out inject in 'from' all transactions
            return projectUtils.injectKeyValueInArray(fromTransactions, {type: 'out', isPending: false})
        })
        .then((outTransactions) => {
            if (outTransactions !== "No transaction in from")
                allTransactions = outTransactions;
            //find 'to' transactions of address
            return TokenTransaction.find({to: address}).lean();
        })
        .then((toTransactions) => {
            if (!toTransactions.length) {
                // sort transactions in descending order of timestamp
                if (allTransactions.length)
                    allTransactions = allTransactions.sort(function (a, b) {
                        return new Date(b.timestamp) - new Date(a.timestamp);
                    });

                //skip and limit on array
                allTransactions = allTransactions.slice(skip, skip + limit);

                res.json({success: true, transactions: allTransactions});
                throw 'Returned';
            }
            //type:in inject in 'to' all transactions
            return projectUtils.injectKeyValueInArray(toTransactions, {type: 'in', isPending: false})
        })
        .then((inTransactions) => {
            allTransactions = allTransactions.concat(inTransactions);
            // sort transactions in descending order of timestamp
            allTransactions = allTransactions.sort(function (a, b) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });

            //skip and limit on array
            allTransactions = allTransactions.slice(skip, skip + limit);

            return res.json({success: true, transactions: allTransactions});
        })
        .catch((error) => {
            if (error !== 'Returned')
                return res.json({success: false, msg: "Error while getting token transactions.", error: error.message});
        });*/
};

let accountTransactionCount = (req, res) => {
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

    // get transaction count of particular address in token and transaction db
    Transaction.count({$or: [{from: address}, {to: address}]})
        .then((allTransactionCount) => {
            transactionCount = allTransactionCount;
            return TokenTransaction.count({$or: [{from: address}, {to: address}]});
        })
        .then((tokenTransactionCount) => {
            tokenTransactionCount;
            res.json({success: true, transactionCount, tokenTransactionCount});
        })
        .catch((error) => {
            return res.json({success: false, msg: "Error while getting transaction count.", error: error.message});
        });
};

/*// get transaction count of particular address in token and transaction db
Transaction.count({from: address})
    .then((fromTransactionCount) => {
        transactionCount = fromTransactionCount;
        return Transaction.count({to: address});
    })
    .then((toTransactionCount) => {
        transactionCount = transactionCount + toTransactionCount;
        return TokenTransaction.count({from: address});
    })
    .then((fromTokenTransactionCount) => {
        tokenTransactionCount = fromTokenTransactionCount;
        return TokenTransaction.count({to: address});
    })
    .then((toTokenTransactionCount) => {
        tokenTransactionCount = tokenTransactionCount + toTokenTransactionCount;
        res.json({success: true, transactionCount, tokenTransactionCount});
    })
    .catch((error) => {
        return res.json({success: false, msg: "Error while getting transaction count.", error: error.message});
    });
};*/

Controller = {
    transactionHistory,
    tokenTransactionHistory,
    accountTransactionCount
};

module.exports = Controller;
