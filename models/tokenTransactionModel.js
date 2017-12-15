/**
 * Created by Tauseef Naqvi on 15-12-2017.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// schema for transactions
let tokenTransactionSchema = new Schema({
    hash: {type: String, required: true, unique: true},
    blockNumber: {type: Number},
    tokenAddress: {type: String},
    tokenSymbol:{type:String},
    decimals:{type:String},
    from: {type: String},
    to: {type: String},
    value: {type: String},
    timestamp: {type: Date}
});

module.exports = mongoose.model('tokenTransaction', tokenTransactionSchema);
