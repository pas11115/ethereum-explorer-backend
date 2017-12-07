/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// schema for transactions
let transactionSchema = new Schema({
    address: {type: String, required: true, unique: true},
    transactions:[{
        _id: false,
        hash:{type:String},
        blockHash:{type:String},
        blockNumber:{type:Number},
        transactionIndex:{type:Number},
        from:{type:String},
        to:{type:String},
        gasPrice:{type:String},
        gasLimit:{type:String},
        txtFee:{type:String},
        value:{type:String},
        nonce:{type:String},
        data:{type:String},
        timestamp:{type:Date},
        type:{type:String}, //type in/out for type of transaction
    }]

})

module.exports = mongoose.model('transaction', transactionSchema);
