/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
const config = {
    'port': 8001,                                         // set ourport
    'database': 'mongodb://127.0.0.1:27017/blockchain-explorer',          // database connection link
    'rpcUrl':'http://ec2-54-254-143-33.ap-southeast-1.compute.amazonaws.com:8545'
};
module.exports = config;