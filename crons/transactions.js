/**
 * Created by Tauseef Naqvi on 28-03-2018.
 */
const config = require('./../config');
let web3 = require('web3');
web3 = new web3(new web3.providers.HttpProvider(config.rpcUrl));
const ethers = require('ethers');
const async = require('async');
const InputDataDecoder = require('input-data-decoder-ethereum');
const projectUtils = require('./../projectUtils');
const providers = ethers.providers;
const utils = ethers.utils;
const decoder = new InputDataDecoder(projectUtils.abi);

// let provider = new providers.JsonRpcProvider(config.rpcUrl,{chainId: 1});
//change network for other chainId
let provider = new providers.JsonRpcProvider(config.rpcUrl);

//update last block number in db
let updateLastBlockNumber = (db, latestBlockNumber, callback) => {
    db.configDb.put('latestBlockNumber', latestBlockNumber)
        .then(() => {
            callback(null)
        })
        .catch((err) => {
            return callback(err);
        });
};

//find last updated block number in db
let latestBlockNumber = (db, cb) => {
    projectUtils.findLvDb('latestBlockNumber', db.configDb)
        .then((result) => {
            return cb(Number(result));
        })
        .catch((err) => {
            console.log(err);
            return cb(1);
        });
};

// check and find token details from contract address
let checkAndUpdateErc20 = (db, contractAddress, callback) => {
    let contract = new ethers.Contract(contractAddress, projectUtils.abi, provider);

    let token = {};
    //sample eth address to check contract have valid balanceOf function
    contract.totalSupply()
        .then((totalSupply) => {
            if (totalSupply !== '0')
                token.totalSupply = totalSupply;
            return contract.balanceOf('0xCF4eE917014309655b1f4055861a45782403127d')
        })
        .then(() => {
            return contract.decimals();
        })
        .then((decimals) => {
            if (decimals !== '0')
                token.decimals = decimals;
            return contract.name();
        })
        .then((name) => {
            if (name !== '0')
                token.name = name;
            return contract.symbol();
        })
        .then((symbol) => {
            if (symbol !== '0')
                token.symbol = symbol;
            if (Object.keys(token).length) {
                db.erc20TokenDb.put(contractAddress, JSON.stringify(token));
                return callback(token);
            }
            else callback(false)
        })
        .catch((err) => {
            if (err.message !== "invalid bytes") {
                console.log(err);
                console.log(contractAddress + " - " + err);
            }
            if (Object.keys(token).length) {
                db.erc20TokenDb.put(contractAddress, JSON.stringify(token));
                return callback(token);
            }
            else callback(false)
        });
};

//find token transaction details from data/input parameter of transaction and update token transaction
let findTokenTransactionsFromData = (db, transaction, timestamp, callback) => {

    //decode transaction data to check transfer function exits
    let tokenTransactionData = decoder.decodeData(transaction.input);
    let oldTransaction, tokenToAddress, transactionValue;

    //check decoded data name is transfer or not
    if (Object.keys(tokenTransactionData).length ? tokenTransactionData.name === 'transfer' : false) {
        projectUtils.findLvDb(transaction.to, db.erc20TokenDb)
            .then((_oldTransaction) => {
                if (_oldTransaction)
                    if (Object.keys(_oldTransaction).length ? _oldTransaction.isErc20Token && _oldTransaction.token : false) {
                        tokenToAddress = "0x" + tokenTransactionData.inputs[0];
                        //validate address and getChecksumAddress
                        try {
                            tokenToAddress = utils.getAddress(tokenToAddress);
                        } catch (error) {
                            throw error;
                        }
                        transactionValue = tokenTransactionData.inputs[1];
                        oldTransaction = _oldTransaction;
                        let transDetails = {
                            hash: transaction.hash,
                            blockNumber: transaction.blockNumber,
                            tokenAddress: transaction.to,
                            tokenSymbol: oldTransaction.token.symbol,
                            decimals: oldTransaction.token.decimals,
                            from: transaction.from,
                            to: tokenToAddress,
                            value: transactionValue,
                            timestamp: timestamp
                        };
                        return db.tokenTransactionDb.put(transaction.hash, JSON.stringify(transDetails))
                    }
            })
            .then(() => {
                return projectUtils.findAndUpdateLvDb(transaction.from, transaction.hash, db.tokenAccountDb);
            })
            .then(() => {
                return projectUtils.findAndUpdateLvDb(transaction.to, transaction.hash, db.tokenAccountDb);
            })
            .catch((err) => {
                callback(err);
            });
    }
};

//get all transaction details from block and update in db
let getTransactionFromBlock = (db, block, callback) => {

    //timestamp in seconds convert into milliseconds
    let timestamp = Number(block.timestamp) * 1000;

    async.each(block.transactions, function (transaction, next) {

        web3.eth.getTransactionReceipt(transaction.hash)
            .then(function (transactionReceipt) {
                // check transaction data for update token transactions
                // check transaction data not empty and not contact deployment and have 'to' address
                if (transaction.input !== "0x" && !transactionReceipt.contractAddress && transaction.to)
                    findTokenTransactionsFromData(db, transaction, timestamp, (err) => {
                        if (err) {
                            console.log("Error in findTokenTransactions:- ");
                            console.log(err);
                        }
                    });

                let isContractCreation = false;
                let gasPrice = transaction.gasPrice;
                let txtFee = gasPrice * transactionReceipt.gasUsed;

                if (transactionReceipt.contractAddress && !transaction.to) {
                    transaction.to = transactionReceipt.contractAddress;
                    isContractCreation = true;
                }
                let newTransaction = {
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
                    isErc20Token: false
                };
                if (!isContractCreation) {
                    return db.transactionDb.put(transaction.hash, JSON.stringify(newTransaction));
                }
                //call token details function to update token details
                return checkAndUpdateErc20(db, transactionReceipt.contractAddress, (token) => {
                    if (!token)
                        return db.transactionDb.put(transaction.hash, JSON.stringify(newTransaction));
                    newTransaction.isErc20Token = true;
                    return db.transactionDb.put(transaction.hash, JSON.stringify(newTransaction));
                });
            })
            .then(() => {
                return projectUtils.findAndUpdateLvDb(transaction.from, transaction.hash, db.accountDb);
            })
            .then(() => {
                return projectUtils.findAndUpdateLvDb(transaction.to, transaction.hash, db.accountDb);
            })
            .then(() => {
                next()
            }).catch((error) => {
            console.log("Error while getting transaction receipt: ");
            console.log(error);
            next();
        });
    }, function (error) {
        if (error) {
            console.log("Error in async eachSeries:- ");
            console.log(error);
        }
        return callback()
    });
};

//custom web3 getBlock with transaction details function if not respond re call in 1 sec
let customWeb3GetBlock = (blockNumber) => {
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
                console.log("Web3 not responding in 10 sec refresh at " + Date.now());
                reject('Web3 Timeout');
            }
        }, 10000);
    })
};

// cron function to get transaction from every blocks
let getTransactions = (db) => {
    latestBlockNumber(db, function (blockNumber) {

        //get all transaction details of this block with transaction details
        customWeb3GetBlock(blockNumber)
            .then(function (block) {
                if (!block)
                    throw 'No Block found';

                if (!block.transactions.length)
                    throw 'Block has no transaction';

                getTransactionFromBlock(db, block, () => {
                    blockNumber++;
                    updateLastBlockNumber(db, blockNumber, (err) => {
                        if (err)
                            console.log(err);
                        getTransactions(db);
                    });
                });

            })
            .catch((error) => {
                if (error === 'Web3 Timeout')
                    return getTransactions(db);

                if (error === 'No Block found')
                    return setTimeout(function () {
                        getTransactions(db);
                        console.log("Block number " + blockNumber + " not found retry....");
                    }, 10000);

                if (error === 'Block has no transaction') {
                    blockNumber++;
                    return updateLastBlockNumber(db, blockNumber, (err) => {
                        if (err)
                            console.log(err);
                        getTransactions(db);
                    })
                }
                console.log("Get block details error: ");
                console.log(error);
                setTimeout(function () {
                    getTransactions(db);
                }, 10000);
            });
    });
};
module.exports = {
    getTransactions,
};