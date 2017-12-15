/**
 * Created by Tauseef Naqvi on 15-12-2017.
 */
const config = require('./../config');
let web3 = require('web3');
web3 = new web3(new web3.providers.HttpProvider(config.rpcUrl));
const ethers = require('ethers');
const async = require('async');
const InputDataDecoder = require('ethereum-input-data-decoder');
const projectUtils = require('./../projectUtils');
const providers = ethers.providers;
const Contract = ethers.Contract;
const utils = ethers.utils;
const network = providers.networks.ropsten;
const decoder = new InputDataDecoder(projectUtils.abi);

let Transaction = require('../models/transactionModel');
let TokenTransaction = require('../models/tokenTransactionModel');
let Configuration = require('./../models/configurationModel');
// let provider = new providers.JsonRpcProvider(config.rpcUrl,{chainId: 1});
//change network for other chainId
let provider = new providers.JsonRpcProvider(config.rpcUrl, network);

let updateLastBlockNumber = (latestBlockNumber, callback) => {
    Configuration.findOneAndUpdate({key: "latestBlockNumber"}, {value: latestBlockNumber}, {
        new: true,
        upsert: true
    }, (err, result) => {
        if (err) {
            console.log("Error while updating latest block number: ");
            console.log(err);
            return callback(err);
        }
        callback(null)
    })
};

function latestBlockNumber(cb) {
    Configuration.findOne({key: "latestBlockNumber"}, (err, result) => {
        if (err) {
            console.log("Error while finding last block number: ");
            console.log(err);
        }
        if (result)
            return cb(Number(result.value));
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

let findTokenTransactionsFromData = (transaction, timestamp, callback) => {
    //decode transaction data to check transfer function exits
    let tokenTransactionData = decoder.decodeData(transaction.input);
    //check decoded data name is transfer or not
    if (Object.keys(tokenTransactionData).length ? tokenTransactionData.name === 'transfer' : false) {
        Transaction.findOne({to: new RegExp(transaction.to, "i"), isErc20Token: true})
            .then((oldTransaction) => {
                if (oldTransaction)
                    if (Object.keys(oldTransaction).length ? oldTransaction.isErc20Token && oldTransaction.token : false) {
                        let tokenToAddress = "0x" + tokenTransactionData.inputs[0];
                        let transactionValue = tokenTransactionData.inputs[1];

                        let newTokenTransaction = new TokenTransaction({
                            hash: transaction.hash,
                            blockNumber: transaction.blockNumber,
                            tokenAddress: transaction.to,
                            tokenSymbol: oldTransaction.token.symbol,
                            decimals: oldTransaction.token.decimals,
                            from: transaction.from,
                            to: tokenToAddress,
                            value: transactionValue,
                            timestamp: timestamp
                        });
                        return newTokenTransaction.save()
                    }
            }).then((result) => {
            // console.log(result)
        }).catch((err) => {
            return callback(err)
        })
    }
};

let getTransactionFromBlock = (block, callback) => {
    //timestamp in seconds convert into milliseconds
    let timestamp = Number(block.timestamp) * 1000;

    async.eachSeries(block.transactions, function (transaction, next) {
        web3.eth.getTransactionReceipt(transaction.hash).then(function (transactionReceipt) {

            // check transaction data for update token transactions
            // check transaction data not empty and not contact deployment and have 'to' address
            if (transaction.input !== "0x" && !transaction.contractAddress && transaction.to)
                findTokenTransactionsFromData(transaction, timestamp, (err) => {
                    if (err){
                        console.log("Error in indTokenTransactions fn catch.");
                        console.log(err);
                    }
                });

            let gasPrice = transaction.gasPrice;
            let txtFee = gasPrice * transactionReceipt.gasUsed;

            let isContractCreation = false;

            if (transactionReceipt.contractAddress && !transaction.to) {
                transaction.to = transactionReceipt.contractAddress;
                isContractCreation = true;
            }
            let newTransaction = new Transaction({
                hash: transaction.hash,
                blockNumber: transaction.blockNumber,
                transactionIndex: transaction.transactionIndex,
                timestamp: timestamp,
                from: transaction.from,
                to: transaction.to,
                value: transaction.value,
                gasLimit: transaction.gasLimit,
                gasUsed: transactionReceipt.gasUsed,
                gasPrice: transaction.gasPrice,
                txtFee: txtFee,
                nonce: transaction.nonce,
                data: transaction.input,
                isContractCreation: isContractCreation,
            });
            if (!isContractCreation)
                return newTransaction.save((err, result) => {
                    if (err){
                        console.log("Error while saving new Transaction.");
                        console.log(err);
                    }
                    next()
                });
            getTokenDetails(transactionReceipt.contractAddress, (err, token) => {
                if (err) {
                    console.log("Error while getting token details: ");
                    console.log(err);
                    return next();
                }
                newTransaction.isErc20Token = true;
                newTransaction.token = token;
                newTransaction.save((err, result) => {
                    if (err){
                        console.log("Error while saving new Transaction with isErc20Token.");
                        console.log(err);
                    }
                    next()
                })
            });
        }).catch((error) => {
            console.log("Error while getting transaction receipt: ");
            console.log(error);
            next();
        });
    }, function (error) {
        if (error){
            console.log("Error in async.eachSeries fn .");
            console.log(error);
        }
        return callback()
    });
};

function customWeb3GetBlock(blockNumber) {

    return new Promise(function (resolve, reject) {
        let finished = false;
        web3.eth.getBlock(blockNumber, true)
            .then(function (block) {
                finished = true;
                resolve(block);
            })
            .catch(function (err) {
                reject(err);
            });

        setTimeout(function () {
            if (!finished) {
                reject('Web3 Timeout');
            }
        }, 1000);

    })
}


let getTransactions = () => {
    latestBlockNumber(function (blockNumber) {
        //get all transaction details of this block with block details
        customWeb3GetBlock(blockNumber)
            .then(function (block) {
                if (!block)
                    throw 'No Block found';

                if (!block.transactions.length)
                    throw 'Block has no transaction';

                getTransactionFromBlock(block, () => {
                    blockNumber++;
                    updateLastBlockNumber(blockNumber, (err) => {
                        if (err)
                            console.log(err);
                        getTransactions();
                    });
                });

            })
            .catch((error) => {

                if (error === 'Web3 Timeout')
                    return getTransactions();
                if (error === 'No Block found')
                    return setTimeout(function () {
                        getTransactions();
                        console.log("Block number " + blockNumber + " not found retry....");
                    }, 10000);
                if (error === 'Block has no transaction') {
                    blockNumber++;
                    return updateLastBlockNumber(blockNumber, (err) => {
                        if (err)
                            console.log(err);
                        getTransactions();

                    })
                }

                console.log("Get block details error: ");
                console.log(error);
                setTimeout(function () {
                    getTransactions();
                }, 10000);
            });
    });
};
module.exports = {
    getTransactions: getTransactions,
};