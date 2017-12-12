/**
 * Created by Tauseef Naqvi on 05-12-2017.
 */
const config = {
    'port': 8001,                                         // set ourport
    'database': 'mongodb://127.0.0.1:27017/blockchain-explorer',          // database connection link
    'rpcUrl':'http://ec2-34-216-38-15.us-west-2.compute.amazonaws.com:8545'
};
module.exports = config;