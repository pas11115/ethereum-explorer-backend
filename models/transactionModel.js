/**
 * Created by Tauseef Naqvi on 15-12-2017.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// schema for transactions
let transactionSchema = new Schema({
    hash: {type: String, required: true, unique: true},
    blockNumber: {type: Number},
    transactionIndex: {type: Number},
    timestamp: {type: Date, index: true},
    from: {type: String, index: true},
    to: {type: String, index: true},
    value: {type: String},
    gasLimit: {type: String},
    gasUsed: {type: String},
    gasPrice: {type: String},
    txtFee: {type: String},
    nonce: {type: String},
    data: {type: String},
    isContractCreation: {type: Boolean},
    isErc20Token: {type: Boolean, index: true},
    token: {
        name: {type: String},
        symbol: {type: String},
        decimals: {type: String},
        totalSupply: {type: String}
    }
});

module.exports = mongoose.model('transaction', transactionSchema);
