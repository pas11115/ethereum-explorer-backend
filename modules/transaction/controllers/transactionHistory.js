/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let ethers = require('ethers');
let utils = ethers.utils;
let Transaction = require('../../../models/transactionModel');
let TokenTransaction = require('../../../models/tokenTransactionModel');
let projectUtils = require('./../../../projectUtils');

let transactionHistory1 = (req, res) => {
    let address = req.params.address;

    if (!address)
        return res.json({success: false, msg: "Address can't be null."});

    //validate address and getChecksumAddress
    try {
        address = utils.getAddress(address);
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }

    //find 'from' transactions of address
    Transaction.find({from: new RegExp(address, "i")})
        .then((fromTransactions) => {
            if (!fromTransactions.length)
                return "No transaction in from";
            //type:out inject in 'from' all transactions
            res.json({success: true, transactions: fromTransactions});
        })
        .catch((error) => {
            if (error !== 'Returned')
                return res.json({success: false, msg: "Error while getting transactions.", error: error.message});
        });
};
let transactionHistory2 = (req, res) => {
    let address = req.params.address;

    if (!address)
        return res.json({success: false, msg: "Address can't be null."});

    //validate address and getChecksumAddress
    try {
        address = utils.getAddress(address);
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }

    //find 'from' transactions of address
    Transaction.find({from: new RegExp(address, "i")})
        .then((fromTransactions) => {
            if (!fromTransactions.length)
                return "No transaction in from";
            //type:out inject in 'from' all transactions
            res.json({success: true, transactions: fromTransactions});
        })
        .catch((error) => {
            if (error !== 'Returned')
                return res.json({success: false, msg: "Error while getting transactions.", error: error.message});
        });
};
let transactionHistory3 = (req, res) => {
    let address = req.params.address;

    if (!address)
        return res.json({success: false, msg: "Address can't be null."});

    //validate address and getChecksumAddress
    try {
        address = utils.getAddress(address);
    } catch (error) {
        return res.json({success: false, msg: "Address is not valid.", error: error});
    }

    //find 'from' transactions of address
    Transaction.find({to: new RegExp(address, "i")}).lean()
        .then((fromTransactions) => {
            if (!fromTransactions.length)
                return "No transaction in from";
            //type:out inject in 'from' all transactions
            res.json({success: true, transactions: fromTransactions});
        })
        .catch((error) => {
            if (error !== 'Returned')
                return res.json({success: false, msg: "Error while getting transactions.", error: error.message});
        });
};

let transactionHistory = (req, res) => {
    let address = req.params.address;
    let t = new Date();
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
            console.log("In 1 time: "+(new Date()-t))
            if (!fromTransactions.length)
                return "No transaction in from";
            //type:out inject in 'from' all transactions
            return projectUtils.injectKeyValueInArray(fromTransactions, {type: 'out', isPending: false})
        })
        .then((outTransactions) => {
            console.log("In 2 time: "+(new Date()-t))
            if (outTransactions !== "No transaction in from")
                allTransactions = outTransactions;
            //find 'to' transactions of address
            return Transaction.find({to: new RegExp(address, "i")}).lean();
        })
        .then((toTransactions) => {
            console.log("In 3 time: "+(new Date()-t))
            if (!toTransactions.length) {
                // sort transactions in descending order of timestamp
                if (allTransactions.length)
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
            console.log("In 4 time: "+(new Date()-t))
            allTransactions = allTransactions.concat(inTransactions);
            // sort transactions in descending order of timestamp
            allTransactions = allTransactions.sort(function (a, b) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            console.log("In 5 time: "+(new Date()-t))
            return res.json({success: true, transactions: allTransactions});
        })
        .catch((error) => {
            if (error !== 'Returned')
                return res.json({success: false, msg: "Error while getting transactions.", error: error.message});
        });
};

let tokenTransactionHistory = (req, res) => {
    let address = req.params.address;

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
            if (!fromTransactions.length)
                return "No transaction in from";
            //type:out inject in 'from' all transactions
            return projectUtils.injectKeyValueInArray(fromTransactions, {type: 'out', isPending: false})
        })
        .then((outTransactions) => {
            if (outTransactions !== "No transaction in from")
                allTransactions = outTransactions;
            //find 'to' transactions of address
            return TokenTransaction.find({to: new RegExp(address, "i")}).lean();
        })
        .then((toTransactions) => {
            if (!toTransactions.length) {
                // sort transactions in descending order of timestamp
                if (allTransactions.length)
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
    transactionHistory1,
    transactionHistory2,
    transactionHistory3,
    transactionHistory,
    tokenTransactionHistory
};

module.exports = Controller;
