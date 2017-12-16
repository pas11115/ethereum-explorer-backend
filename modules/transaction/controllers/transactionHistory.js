/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let ethers = require('ethers');
let utils = ethers.utils;
let Transaction = require('../../../models/transactionModel');
let TokenTransaction = require('../../../models/tokenTransactionModel');
let projectUtils = require('./../../../projectUtils');

let transactionHistory = (req, res) => {
    let address = req.body.address;

    if (!address)
        return res.json({success: false, msg: "Address can't be null."});

    //validate address and getChecksumAddress
    try {
        address = utils.getAddress(address);
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }
    let allTransactions = [];

    //find 'from' transactions of address
    Transaction.find({from: new RegExp(address, "i")}).lean()
        .then((fromTransactions) => {
            if (!fromTransactions.length) {
                res.json({success: true, transactions: allTransactions});
                throw 'Returned';
            }

            //type:out inject in 'from' all transactions
            return projectUtils.injectKeyValueInArray(fromTransactions, {type: 'out', isPending: false})
        })
        .then((outTransactions) => {
            allTransactions = outTransactions;
            //find 'to' transactions of address
            return Transaction.find({to: new RegExp(address, "i")}).lean();
        })
        .then((toTransactions) => {
            if (!toTransactions.length) {
                // sort transactions in descending order of timestamp
                allTransactions = allTransactions.sort(function (a, b) {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
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
            return res.json({success: true, transactions: allTransactions});
        })
        .catch((error) => {
            if (error !== 'Returned')
                return res.json({success: false, msg: "Error while getting transactions.", error: error.message});
        });
};

let tokenTransactionHistory = (req, res) => {
    let address = req.body.address;

    if (!address)
        return res.json({success: false, msg: "Address can't be null."});

    //validate address and getChecksumAddress
    try {
        address = utils.getAddress(address);
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }
    let allTransactions = [];

    //find 'from' transactions of address
    TokenTransaction.find({from: new RegExp(address, "i")}).lean()
        .then((fromTransactions) => {
            if (!fromTransactions.length){
                res.json({success: true, transactions: allTransactions});
                throw 'Returned';
            }
            //type:out inject in 'from' all transactions
            return projectUtils.injectKeyValueInArray(fromTransactions, {type: 'out', isPending: false})
        })
        .then((outTransactions) => {
            allTransactions = outTransactions;
            //find 'to' transactions of address
            return TokenTransaction.find({to: new RegExp(address, "i")}).lean();
        })
        .then((toTransactions) => {
            if (!toTransactions.length) {
                // sort transactions in descending order of timestamp
                allTransactions = allTransactions.sort(function (a, b) {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
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
            return res.json({success: true, transactions: allTransactions});
        })
        .catch((error) => {
            if (error !== 'Returned')
            return res.json({success: false, msg: "Error while getting token transactions.", error: error.message});
        });
};

Controller = {
    transactionHistory,
    tokenTransactionHistory
};

module.exports = Controller;
