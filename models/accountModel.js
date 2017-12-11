/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// schema for transactions
let accountSchema = new Schema({
    address: {type: String, required: true, unique: true},
    isContract: {type: Boolean},
    isErc20Token: {type: Boolean},
    token: {
        name: {type: String},
        symbol: {type: String},
        standard: {type: String},
        decimals: {type: String},
        totalSupply: {type: String},
        owner: {type: String},
    },
    transactions: [{
        _id: false,
        isContractCreation: {type: Boolean},
        hash: {type: String},
        blockHash: {type: String},
        blockNumber: {type: Number},
        transactionIndex: {type: Number},
        from: {type: String},
        to: {type: String},
        gasPrice: {type: String},
        gasLimit: {type: String},
        txtFee: {type: String},
        value: {type: String},
        nonce: {type: String},
        data: {type: String},
        timestamp: {type: Date},
        type: {type: String}, //type in/out for type of transaction
        isPending:{type:Boolean}
    }],
    tokenTransactions: [{
        _id: false,
        tokenAddress: {type: String},
        tokenSymbol:{type:String},
        decimals:{type:String},
        hash: {type: String},
        from: {type: String},
        to: {type: String},
        value: {type: String},
        timestamp: {type: Date},
        type: {type: String}, //type in/out for type of transaction
        isPending:{type:Boolean}
    }]
});

module.exports = mongoose.model('account', accountSchema);
