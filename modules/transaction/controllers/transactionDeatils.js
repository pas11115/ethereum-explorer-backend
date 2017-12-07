/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
let ethers = require('ethers');
let utils = ethers.utils;
let config = require('../../../config');
let Transaction = require('./../../../models/transactionModel');
let projectUtils = require('./../../../projectUtils');

let transactionDeatils = (req, res) => {
    let address = req.body.address;
    try{
        address = utils.getAddress(address.toLowerCase());
    } catch(error) {
        return res.json({success: false, msg: "Address is not valid."});
    }

    Transaction.findOne({address:address.toLowerCase()},(err,trans)=>{
        if(err)
            return res.json({success:false,msg:"Error while getting transaction history.",error:err});
        if (!trans)
            return res.json({success:true,transactions:[]});
        res.json({success:true,transactions:trans.transactions});
    })
};

Controller = {
    transactionDeatils: transactionDeatils,
};

module.exports = Controller;
