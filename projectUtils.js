/**
 * Created by Tauseef Naqvi on 09-04-2018.
 */
const config = require('./config');
let web3 = require('web3');
web3 = new web3(new web3.providers.HttpProvider(config.rpcUrl));
const async = require('async');
const ethers = require('ethers');
const utils = ethers.utils;
const InputDataDecoder = require('input-data-decoder-ethereum');

module.exports.abi = abi = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "success", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_from", "type": "address"}, {"name": "_to", "type": "address"}, {
            "name": "_value",
            "type": "uint256"
        }],
        "name": "transferFrom",
        "outputs": [{"name": "success", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "standard",
        "outputs": [{"name": "", "type": "string"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [{"name": "", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}, {
            "name": "_extraData",
            "type": "bytes"
        }],
        "name": "approveAndCall",
        "outputs": [{"name": "success", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [{"name": "", "type": "address"}, {"name": "", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"name": "initialSupply", "type": "uint256"}, {
            "name": "tokenName",
            "type": "string"
        }, {"name": "decimalUnits", "type": "uint8"}, {"name": "tokenSymbol", "type": "string"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "from", "type": "address"}, {
            "indexed": true,
            "name": "to",
            "type": "address"
        }, {"indexed": false, "name": "value", "type": "uint256"}],
        "name": "Transfer",
        "type": "event"
    }
];


const decoder = new InputDataDecoder(abi);

//TODO: get pending transaction from tx pool
module.exports.getPendingTransactions = (address, isToken, callback) => {
    address = address.toLowerCase();
    web3.eth.getBlock('pending', true).then((block) => {
        let transactions = [];
        if (!block.transactions.length)
            return callback(null, transactions);
        let timestamp = block.timestamp;
        async.eachSeries(block.transactions, function (transaction, next) {
            if (isToken) {
                if (transaction.input != "0x" && transaction.to) {
                    let tokenTransactionData = decoder.decodeData(transaction.input);
                    if (Object.keys(tokenTransactionData).length ? tokenTransactionData.name == 'transfer' : false) {
                        Account.findOne({address: transaction.to.toLowerCase()}, (err, oldTransaction) => {
                            if (err) {
                                console.log(err);
                                next(err)
                            }
                            if (Object.keys(oldTransaction).length ? oldTransaction.isErc20Token : false && oldTransaction.token) {
                                let tokenToAddress = "0x" + tokenTransactionData.inputs[0];
                                let transactionValue = tokenTransactionData.inputs[1];
                                let tokenTransactionObj = {
                                    tokenAddress: transaction.to,
                                    tokenSymbol: oldTransaction.token.symbol,
                                    decimals: oldTransaction.token.decimals,
                                    hash: transaction.hash,
                                    from: transaction.from,
                                    to: tokenToAddress,
                                    value: transactionValue.toString(),
                                    timestamp: new Date(timestamp * 1000).toJSON(),//timestamp in seconds convert into milliseconds and also convert into JSON date
                                    type: "in",
                                    isPending: true
                                };

                                if (transaction.from.toLowerCase() == address)
                                    tokenTransactionObj.type = "out";
                                if (address == transaction.from.toLowerCase() || address == tokenToAddress.toLowerCase())
                                    transactions.push(tokenTransactionObj);
                                next()
                            }
                            else next()
                        })
                    }
                    else next()
                }
                else next()
            }
            else {
                let transactionObj = {
                    isContractCreation: false,
                    hash: transaction.hash,
                    blockHash: transaction.blockHash,
                    blockNumber: transaction.blockNumber,
                    transactionIndex: transaction.transactionIndex,
                    from: transaction.from,
                    gasPrice: transaction.gasPrice.toString(),
                    gasLimit: transaction.gas.toString(),
                    value: transaction.value.toString(),
                    nonce: transaction.nonce,
                    data: transaction.input,
                    timestamp: new Date(timestamp * 1000).toJSON(),//timestamp in seconds convert into milliseconds and also convert into JSON date
                    type: "in",
                    isPending: true
                };
                let transToMatched = false;
                if (transaction.to) {
                    transToMatched = address == transaction.to.toLowerCase();
                    transactionObj.to = transaction.to;
                }
                else transactionObj.isContractCreation = true;


                if (transaction.from.toLowerCase() == address.toLowerCase())
                    transactionObj.type = "out";

                if (address == transaction.from.toLowerCase() || transToMatched)
                    transactions.push(transactionObj);
                next()
            }

        }, function (error) {
            if (error)
                callback(error);
            callback(null, transactions);
        });
    }).catch((err) => {
        console.log("error(catch) in web3.eth.getBlock:- ");
        console.log(err);
        callback(err)
    });
};

// function to inject key values in all object of json array

module.exports.injectKeyValueInArray = (array, keyValues) => {
    return new Promise((resolve, reject) => {
        if (!array.length)
            return resolve(array);
        let newArray = [];
        async.each(array, (object, next) => {
            for (let key in keyValues) {
                object[key] = keyValues[key]
            }

            newArray.push(object);
            next();
        }, (err) => {
            if (err)
                return reject(err);
            resolve(newArray);
        })
    })
};

module.exports.findLvDb = findLvDb = (key, db) => {
    return new Promise((resolve, reject) => {
        db.get(key)
            .then((_value) => {
                resolve(_value.toString('utf8'))
            })
            .catch((err) => {
                if (err.message.indexOf('Key not found in database') !== -1) {
                    resolve(false)
                }
                reject(err)
            })
    })
};

module.exports.findAndUpdateLvDb = (key, value, db) => {
    return new Promise((resolve, reject) => {
        findLvDb(key, db)
            .then((_value) => {
                if (_value && _value.indexOf(value) !== -1) {
                    resolve();
                } else if (_value) {
                    db.put(key, value + ',' + _value);
                    resolve();
                } else {
                    db.put(key, value);
                    resolve()
                }
            })
            .catch(reject)
    })
};