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
    contract.name().then(function (name) {
        contract.symbol().then(function (symbol) {
            contract.decimals().then(function (decimals) {
                contract.totalSupply().then(function (totalSupply) {
                    contract.owner().then(function (owner) {
                        contract.standard().then(function (standard) {
                            // console.log("Name of token: " + name);
                            // console.log("Symbol of token: " + symbol);
                            // console.log("Decimals of token: " + decimals);
                            // console.log("Total supply of token: " + utils.formatEther(totalSupply.toString()));
                            // console.log("Owner of token: " + owner);
                            // console.log("Standard of token: " + standard);

                            return callback(null, {
                                name: name,
                                symbol: symbol,
                                decimals: decimals,
                                totalSupply: totalSupply,
                                owner: owner,
                                standard: standard
                            })
                        }).catch((err) => {
                            return callback(err);
                        });
                    }).catch((err) => {
                        return callback(err);
                    });
                }).catch((err) => {
                    return callback(err);
                });
            }).catch((err) => {
                return callback(err);
            });
        }).catch((err) => {
            return callback(err);
        });
    }).catch((err) => {
        // console.log("Error while getting token name: ");
        // console.log(err);
        return callback("Not a valid Erc20 token contract");
    });
};

let getTransactions = () => {
    // provider.getBlock("pending").then(function (blockNumber) {
    //     console.log("Current block number: " + blockNumber);
    // });
    // provider.getTransactionCount("0xbe76Bc7079B2207932705594bA4F8e5a1BA7545F").then(function (transactionCount) {
    //     console.log("Total Transactions Ever Send: " + transactionCount);
    // });
    // provider.getTransactionCount("0xbe76Bc7079B2207932705594bA4F8e5a1BA7545F", 'pending').then(function (transactionCount) {
    //     console.log("Total Transactions Ever Send: " + transactionCount);
    // });
    lastBlockNumber(function (blockNumber) {
        blockNumber = Number(blockNumber);
        provider.getBlock(blockNumber)
            .then(function (block) {
                if (!block)
                    throw 'No Block found';
                let timestamp = block.timestamp;
                if (block.transactions.length) {
                    async.eachSeries(block.transactions, function (transactionHash, next) {
                        provider.getTransactionReceipt(transactionHash).then(function (transactionReceipt) {
                            provider.getTransaction(transactionHash).then(function (transaction) {

                                if (transaction.data != "0x" && !transaction.contractAddress && transaction.to) {
                                    let tokenTransactionData = decoder.decodeData(transaction.data);
                                    if (Object.keys(tokenTransactionData).length ? tokenTransactionData.name == 'transfer' : false) {
                                        Account.findOne({address: transaction.to.toLowerCase()}, (err, oldTransaction) => {
                                            if (err)
                                                console.log(err);
                                            if (oldTransaction.isErc20Token && oldTransaction.token) {
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
                                                        timestamp: timestamp * 1000,//timestamp in seconds convert into milliseconds
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
                                                        console.log(err);
                                                    }
                                                    update.$addToSet["tokenTransactions"].type = "in";
                                                    Account.findOneAndUpdate({address: tokenToAddress.toLowerCase()}, update, {
                                                        upsert: true,
                                                        new: true
                                                    }, (err, tokenTransUpdateTo) => {
                                                        if (err) {
                                                            console.log("Error while updating token transaction from address: ");
                                                            console.log(err);
                                                        }
                                                    })
                                                })
                                            }
                                        })
                                    }
                                }
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

                                Account.findOneAndUpdate({address: transaction.from.toLowerCase()}, update, {
                                    upsert: true,
                                    new: true
                                }, (err, transactionUpdateFrom) => {
                                    if (err) if (err) {
                                        console.log("Error while updating transaction from address: ");
                                        console.log(err);
                                    }
                                    /*console.log("transactionUpdateFrom: ");
                                    console.log(transactionUpdateFrom);*/
                                    update.$addToSet["transactions"].type = "in";
                                    if (isContractCreation)
                                        update.isContract = true;
                                    Account.findOneAndUpdate({address: transaction.to.toLowerCase()}, update, {
                                        upsert: true, new: true
                                    }, (err, transactionUpdateTo) => {
                                        if (err) {
                                            console.log("Error while updating transaction to address: ");
                                            console.log(err);
                                        }
                                        /*console.log("transactionUpdateTo: ");
                                        console.log(transactionUpdateTo);*/
                                        if (isContractCreation) {
                                            getTokenDetails(transactionReceipt.contractAddress, (err, token) => {
                                                if (err) {
                                                    if (err == "Not a valid Erc20 token contract")
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
                            if (err)
                                console.log(err);
                            getTransactions();
                        });
                    });
                }
                else {
                    blockNumber++;
                    updateLastBlockNumber(blockNumber, (err) => {
                        if (err)
                            console.log(err);
                        getTransactions();
                    });
                    // console.log("No transaction found in this block.");
                }
            })
            .catch((error) => {
                if (error == 'No Block found')
                    setTimeout(function () {
                        getTransactions();
                        console.log("Block number " + blockNumber + " not found retry....");
                    }, 10000);
                else {
                    console.log("Get block details error: ");
                    console.log(error)
                }
            });
    });
};
module.exports = {
    getTransactions: getTransactions,
};