let ethers = require('ethers');
let async = require('async');
let providers = ethers.providers;
let Contract = ethers.Contract;
let utils = ethers.utils;
let network = providers.networks.ropsten;

let Transaction = require('./../models/transactionModel');
let Configuration = require('./../models/configurationModel');

let provider = new providers.JsonRpcProvider("http://localhost:8545", {chainId: 1});

let updateLastBlockNumber = (lastBlockNumber) => {
    Configuration.findOneAndUpdate({key: "lastBlockNumber"}, {value: lastBlockNumber}, {upsert: true}, (err, result) => {
        if (err) {
            console.log("Error while updating last block number: ");
            console.log(err);
        }
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


let getTransactions = () => {
    lastBlockNumber(function (blockNumber) {
        blockNumber = Number(blockNumber);
        provider.getBlock(blockNumber)
            .then(function (block) {
                if(!block)
                    throw 'No Block found';
                let timestamp = block.timestamp;
                if (block.transactions.length) {
                    async.eachSeries(block.transactions, function (transactionHash, next) {
                        provider.getTransaction(transactionHash).then(function (transaction) {
                            let gasPrice = utils.formatEther(utils.bigNumberify(transaction.gasPrice));
                            provider.getTransactionReceipt(transactionHash).then(function(transactionReceipt) {
                                let txtFee = gasPrice*transactionReceipt.gasUsed;

                            let update = {
                                hash:transaction.hash,
                                blockHash: transaction.blockHash,
                                blockNumber: transaction.blockNumber,
                                transactionIndex: transaction.transactionIndex,
                                from: transaction.from.toLowerCase(),
                                to: transaction.to.toLowerCase(),
                                gasPrice: utils.bigNumberify(transaction.gasPrice),
                                gasLimit: utils.bigNumberify(transaction.gasLimit),
                                txtFee:txtFee,
                                value: transaction.value,
                                nonce: transaction.nonce,
                                data: transaction.data,
                                timestamp: timestamp * 1000,//timestamp in seconds convert into milliseconds
                                type: "in"
                            };

                            Transaction.findOneAndUpdate({address: transaction.to.toLowerCase()}, {$addToSet: {transactions: update}}, {
                                upsert: true
                            }, (err, transactionUpdateTo) => {
                                if (err) if (err) {
                                    console.log("Error while updating transaction to address: ");
                                    console.log(err);
                                }
                                /*console.log("transactionUpdateTo: ");
                                console.log(transactionUpdateTo);*/
                                update.type = "out";
                                Transaction.findOneAndUpdate({address: transaction.from.toLowerCase()}, {$addToSet: {transactions: update}}, {
                                    upsert: true
                                }, (err, transactionUpdateFrom) => {
                                    if (err) {
                                        console.log("Error while updating transaction from address: ");
                                        console.log(err);
                                    }
                                    /*console.log("transactionUpdateFrom: ");
                                    console.log(transactionUpdateFrom);*/
                                    next()
                                });
                            });
                            }).catch((err)=>{
                                console.log("Error while get transaction recipt")
                            });}).catch((error) => {
                            next();
                            console.log("Get transaction details error: ");
                            console.log(error)
                        })
                    }, function (error) {
                        if (error)
                            console.log(error);
                        blockNumber++;
                        updateLastBlockNumber(blockNumber);
                        getTransactions();
                    });
                }
                else {
                    blockNumber++;
                    updateLastBlockNumber(blockNumber);
                    getTransactions();
                    // console.log("No transaction found in this block.");
                }
            })
            .catch((error) => {
                if(error=='No Block found')
                    setTimeout(function () {
                        getTransactions();
                        console.log("Block number "+blockNumber+" not found retry....");
                    },10000);
                else{
                    console.log("Get block details error: ");
                    console.log(error)
                }
            });
    });

};
module.exports = {
    getTransactions: getTransactions,
};
// provider.getBlockNumber().then(function(blockNumber) {
//     console.log("Current block number: " + blockNumber);
// }).catch((error)=>{
//     console.log("Get block number error: ");
//     console.log(error)
// });