/**
 * Created by Tauseef Naqvi on 06-12-2017.
 */
const ethers = require('ethers');
const async = require('async');
const InputDataDecoder = require('ethereum-input-data-decoder');
const config = require('./../config');
const projectUtils = require('./../projectUtils');
const providers = ethers.providers;
const Contract = ethers.Contract;
const utils = ethers.utils;
const network = providers.networks.ropsten;
const decoder = new InputDataDecoder(projectUtils.abi);

let Account = require('../models/accountModel');
let Configuration = require('./../models/configurationModel');
// let provider = new providers.JsonRpcProvider(config.rpcUrl,{chainId: 1});
//change network for other chainId
let provider = new providers.JsonRpcProvider(config.rpcUrl, network);

let updateLastBlockNumber = (lastBlockNumber, callback) => {
    Configuration.findOneAndUpdate({key: "lastBlockNumber"}, {value: lastBlockNumber}, {upsert: true}, (err, result) => {
        if (err) {
            console.log("Error while updating last block number: ");
            console.log(err);
            return callback(err);
        }
        callback(null)
    })
};

function lastBlockNumber(cb) {
    Configuration.findOne({key: "lastBlockNumber"}, (err, result) => {
        if (err) {
            console.log("Error while finding last block number: ");
            console.log(err);
        }
        if (result)
            return cb(result.value);
        else
            return cb(1);
    });
}

let getTokenDetails = (contractAddress, callback) => {
    let contract = new ethers.Contract(contractAddress, projectUtils.abi, provider);

    let token = {};
    contract.name()
        .then(function (name) {
            token.name = name;
            return contract.symbol();
        })
        .then(function (symbol) {
            token.symbol = symbol;
            return contract.decimals();
        })
        .then(function (decimals) {
            token.decimals = decimals;
            return contract.totalSupply()
        }).then(function (totalSupply) {
        token.totalSupply = totalSupply;
        return contract.owner()
    })
        .then(function (owner) {
            token.owner = owner;
            return contract.standard()
        })
        .then(function (standard) {
            token.standard = standard;
            return callback(null, token);
        })
        .catch((err) => {
            return callback(contractAddress + err);
        });
};

let findTokenTransactionsFromData = (transaction, blockTimestamp, callback) => {
    //decode transaction data to check transfer function exits
    let tokenTransactionData = decoder.decodeData(transaction.data);
    //check decoded data name is transfer or not
    if (Object.keys(tokenTransactionData).length ? tokenTransactionData.name === 'transfer' : false) {
        Account.findOne({address: transaction.to.toLowerCase()}, (err, oldTransaction) => {
            if (err)
                return callback(err);
            if (Object.keys(oldTransaction).length ? oldTransaction.isErc20Token && oldTransaction.token : false) {
                let tokenToAddress = "0x" + tokenTransactionData.inputs[0];
                let transactionValue = tokenTransactionData.inputs[1];
                let update = {};
                update.$addToSet = {
                    tokenTransactions: {
                        tokenAddress: transaction.to,
                        tokenSymbol: oldTransaction.token.symbol,
                        decimals: oldTransaction.token.decimals,
                        hash: transaction.hash,
                        from: transaction.from,
                        to: tokenToAddress,
                        value: transactionValue,
                        timestamp: blockTimestamp * 1000,//timestamp in seconds convert into milliseconds
                        type: "out",
                        isPending: false
                    }
                };
                Account.findOneAndUpdate({address: transaction.from.toLowerCase()}, update, {
                    upsert: true,
                    new: true
                }, (err, tokenTransUpdateFrom) => {
                    if (err) {
                        console.log("Error while updating token transaction from address: ");
                        return callback(err);
                    }
                    update.$addToSet["tokenTransactions"].type = "in";
                    Account.findOneAndUpdate({address: tokenToAddress.toLowerCase()}, update, {
                        upsert: true,
                        new: true
                    }, (err, tokenTransUpdateTo) => {
                        if (err) {
                            console.log("Error while updating token transaction from address: ");
                            return callback(err);
                        }
                    })
                })
            }
        })
    }
};

let getTransactions = () => {
    let inGetTransactions = Date.now();
    lastBlockNumber(function (blockNumber) {
        console.log("in lastBlockNumber taking - "+(Date.now()-inGetTransactions)+" milliseconds");
        blockNumber = Number(blockNumber);
        provider.getBlock(blockNumber)
            .then(function (block) {
                console.log("in provider.getBlock taking: "+(Date.now()-inGetTransactions)+" milliseconds");
                if (!block)
                    throw 'No Block found';
                let timestamp = block.timestamp;
                if (block.transactions.length) {
                    console.log("Transaction found in "+blockNumber+" block");
                    async.eachSeries(block.transactions, function (transactionHash, next) {
                        console.log("in async.eachSeries taking: "+(Date.now()-inGetTransactions)+" milliseconds");
                        provider.getTransactionReceipt(transactionHash).then(function (transactionReceipt) {
                            console.log("in provider.getTransactionReceipt taking: "+(Date.now()-inGetTransactions)+" milliseconds");
                            provider.getTransaction(transactionHash).then(function (transaction) {
                                console.log("in provider.getTransaction taking: "+(Date.now()-inGetTransactions)+" milliseconds");
                                // check transaction data for update token transactions
                                // check transaction data not empty and not contact deployment and have 'to' address
                                if (transaction.data !== "0x" && !transaction.contractAddress && transaction.to)
                                    findTokenTransactionsFromData(transaction,timestamp,(err)=>{
                                        console.log("in findTokenTransactionFromData taking: "+(Date.now()-inGetTransactions)+" milliseconds");

                                        if(err)
                                            console.log(err);
                                    });

                                let gasPrice = utils.formatEther(utils.bigNumberify(transaction.gasPrice));
                                let txtFee = gasPrice * transactionReceipt.gasUsed;
                                let isContractCreation = false;
                                let update = {};
                                if (transactionReceipt.contractAddress && !transaction.to) {
                                    transaction.to = transactionReceipt.contractAddress;
                                    isContractCreation = true;
                                }
                                update.$addToSet = {
                                    transactions: {
                                        isContractCreation: isContractCreation,
                                        hash: transaction.hash,
                                        blockHash: transaction.blockHash,
                                        blockNumber: transaction.blockNumber,
                                        transactionIndex: transaction.transactionIndex,
                                        from: transaction.from,
                                        to: transaction.to,
                                        gasPrice: utils.bigNumberify(transaction.gasPrice),
                                        gasLimit: utils.bigNumberify(transaction.gasLimit),
                                        txtFee: txtFee,
                                        value: transaction.value,
                                        nonce: transaction.nonce,
                                        data: transaction.data,
                                        timestamp: timestamp * 1000,//timestamp in seconds convert into milliseconds
                                        type: "out",
                                        isPending: false
                                    }
                                };

                                Account.update({address: transaction.from.toLowerCase()}, update, {
                                    upsert: true,
                                    new: true
                                }, (err, transactionUpdateFrom) => {
                                    console.log("in findOneAndUpdate of from address taking: "+(Date.now()-inGetTransactions)+" milliseconds");

                                    if (err) if (err) {
                                        console.log("Error while updating transaction from address: ");
                                        console.log(err);
                                    }
                                    /*console.log("transactionUpdateFrom: ");
                                    console.log(transactionUpdateFrom);*/
                                    update.$addToSet["transactions"].type = "in";
                                    if (isContractCreation)
                                        update.isContract = true;
                                    Account.update({address: transaction.to.toLowerCase()}, update, {
                                        upsert: true, new: true
                                    }, (err, transactionUpdateTo) => {
                                        console.log("in findOneAndUpdate of to address taking: "+(Date.now()-inGetTransactions)+" milliseconds");

                                        if (err) {
                                            console.log("Error while updating transaction to address: ");
                                            console.log(err);
                                        }
                                        /*console.log("transactionUpdateTo: ");
                                        console.log(transactionUpdateTo);*/
                                        if (isContractCreation) {
                                            getTokenDetails(transactionReceipt.contractAddress, (err, token) => {
                                                if (err) {
                                                    if (err === "Not a valid Erc20 token contract")
                                                        return next();
                                                    console.log("Error while getting token details: ");
                                                    console.log(err);
                                                    return next();
                                                }
                                                transactionUpdateTo.isErc20Token = true;
                                                transactionUpdateTo.token = token;
                                                transactionUpdateTo.save((err, tokenUpdate) => {
                                                    if (err)
                                                        console.log(err);
                                                    next()
                                                })
                                            });
                                        }
                                        else next()
                                    });
                                });
                            }).catch((error) => {
                                console.log("Error while getting transaction receipt: ");
                                console.log(error);
                                next();
                            });
                        }).catch((error) => {
                            console.log("Error while getting transaction details: ");
                            console.log(error);
                            next();
                        })
                    }, function (error) {
                        if (error)
                            console.log(error);
                        blockNumber++;
                        updateLastBlockNumber(blockNumber, (err) => {
                            console.log("in updateLastBlock and call recursive fn taking: "+(Date.now()-inGetTransactions)+" milliseconds");

                            if (err)
                                console.log(err);
                            getTransactions();
                        });
                    });
                }
                else {
                    console.log("Transaction not found in "+blockNumber+" block");
                    blockNumber++;
                    updateLastBlockNumber(blockNumber, (err) => {
                        if (err)
                            console.log(err);
                        getTransactions();
                    });
                }
            })
            .catch((error) => {
                if (error === 'No Block found')
                    setTimeout(function () {
                        getTransactions();
                        console.log("Block number " + blockNumber + " not found retry....");
                    }, 10000);
                else {
                    console.log("Get block details error: ");
                    console.log(error);
                    setTimeout(function () {
                        getTransactions();
                    }, 10000);
                }
            });
    });
};
module.exports = {
    getTransactions: getTransactions,
};