/**
 * Created by Tauseef Naqvi on 15-12-2017.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// schema for token transactions
let tokenTransactionSchema = new Schema({
    hash: {type: String, required: true, unique: true},
    blockNumber: {type: Number},
    tokenAddress: {type: String,index:true},
    tokenSymbol:{type:String},
    decimals:{type:String},
    from: {type: String,index:true},
    to: {type: String,index:true},
    value: {type: String},
    timestamp: {type: Date}
});

module.exports = mongoose.model('tokenTransaction', tokenTransactionSchema);
