/**
 * Created by Tauseef Naqvi on 06-12-2017.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

//schema for configuration
let configurationSchema = Schema({
    key: {type: String, required: true},
    value: {type: String,required:true}
});

module.exports = mongoose.model('configuration', configurationSchema);
