/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let ethers = require('ethers');
let utils = ethers.utils;
let config = require('../../../config');
let Account = require('../../../models/accountModel');
let projectUtils = require('./../../../projectUtils');

let transactionDetails = (req, res) => {
    let address = req.body.address;
    let transactions = [];
    try {
        address = utils.getAddress(address.toLowerCase());
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }

    Account.findOne({address: address.toLowerCase()}, (err, account) => {
        if (err)
            return res.json({success: false, msg: "Error while getting transaction history.", error: err});
        projectUtils.getPendingTransactions(address, false, (err, pendingTransaction) => {
            if (err)
                return res.json({success: false, msg: "Error while getting pending transactions.", error: err});
            if (pendingTransaction.length)
                transactions = pendingTransaction;
            if (account ? account.transactions.length : false) {
                transactions = transactions.concat(account.transactions);
                transactions = transactions.sort(function(a,b){
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                return res.json({success: true, transactions: transactions});
            }
            transactions = transactions.sort(function(a,b){
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            res.json({success: true, transactions: transactions});
        });
    });
};

let tokenTransactionDetails = (req, res) => {
    let address = req.body.address;
    let transactions = [];
    try {
        address = utils.getAddress(address.toLowerCase());
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }

    Account.findOne({address: address.toLowerCase()}, (err, account) => {
        if (err)
            return res.json({success: false, msg: "Error while getting transaction history.", error: err});
        projectUtils.getPendingTransactions(address, true, (err, pendingTransaction) => {
            if (err)
                return res.json({success: false, msg: "Error while getting pending transactions.", error: err});
            if (pendingTransaction.length)
                transactions = pendingTransaction;
            if (account ? account.tokenTransactions.length : false) {
                transactions = transactions.concat(account.tokenTransactions)
                transactions = transactions.sort(function(a,b){
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                return res.json({success: true, transactions: transactions});
            }
            transactions = transactions.sort(function(a,b){
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            res.json({success: true, transactions: transactions});
        });
    })
};

Controller = {
    transactionDetails: transactionDetails,
    tokenTransactionDetails: tokenTransactionDetails,
};

module.exports = Controller;
