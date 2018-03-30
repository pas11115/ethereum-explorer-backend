const levelUp = require('levelup');
const levelDown = require('leveldown');

// 1) Create our store
const db = levelUp(levelDown('./mydb'));
const configDb = levelUp(levelDown('./levelDbData/configs'));
return configDb.get("latestBlockNumber",function (err,res) {
    if(err)
        return console.log(err);
    console.log(res.toString('utf8'))
})
var transData = {
    "hash": "0x49758e66d8357533321377315745ed08a8a35e8256e293f5fc2ac8dbf9ecacdf",
    "blockNumber": 2513144,
    "transactionIndex": 74,
    "timestamp": "2018-01-24T10:32:03.000+0000",
    "from": "0xA8B506205a3296936F48290B86666613aFB790d8",
    "to": "0x8Ad6ea4B6A404Bc85A2C29452c826a25351e2f7f",
    "value": "0",
    "gasUsed": "52595",
    "gasPrice": "500000000",
    "txtFee": "26297500000000",
    "nonce": "955",
    "data": "0xa9059cbb000000000000000000000000e6a0b7e290007ce39a39b5c1a87ad1ffda70d1d200000000000000000000000000000000000000000000000029a2241af62c0000",
    "isContractCreation": false,
};
let getValueFromDb = (key, db) => {
    return new Promise((resolve, reject) => {
        db.get(key)
            .then((_value) => {
                resolve(_value.toString('utf8'))
            })
            .catch((err) => {
                if (err.message.indexOf('Key not found in database') !== -1) {
                    resolve(false)
                }
                reject(err)
            })
    })
};
let findAndUpdateLvDb = (key, value, db) => {
    return new Promise((resolve, reject) => {
        getValueFromDb(key, db)
            .then((_value) => {
                if (_value)
                    db.put(key, value + ',' + _value)
                else db.put(key, value)
            })
            .catch(reject)
    })
};
return getValueFromDb('latestBlockNumber2', db)
    .then((result) => {
        console.log("In then");
        console.log(result)
        // return cb(Number(result));
    })
    .catch((err) => {
        console.log("in catch");
        console.log(err.message);
        // return cb(1);
    });
return db.createReadStream()
    .on("data", function (data) {
        console.log(data.key.toString('utf8'), '=', data.value.toString('utf8'))
    })
    .on('error', function (err) {
        console.log('Oh my!', err)
    })
    .on('close', function () {
        console.log('Stream closed')
    })
    .on('end', function () {
        console.log('Stream ended')
    })
transData = JSON.stringify(transData);
let array = [];
// 2) Put a key & value
for (let v = 1; v <= 1000000; v++) {
    let i = v + " new";

    console.log(i);
    // db.put('name' + i, transData, function (err) {
    //     if (err) return console.log('Ooops!', err) // some kind of I/O error
    //
    //     // 3) Fetch by key
    //     // db.get('name' + i, function (err, value) {
    //     //     if (err) return console.log('Ooops!', err) // likely the key was not found
    //     //
    //     //     // Ta da!
    //     //     console.log('name' + i + '=' + value)
    //     // })
    // });
    db.get('name' + i, function (err, value) {
        if (err) return console.log('Ooops!', err) // likely the key was not found
        array.push(JSON.parse(value))
        if (i === 1000000 + " new")
            console.log(array);
        // Ta da!
        // console.log('name' + i + '=' + value)
    })

}
// db.get('name', function (err, value) {
//     if (err) return console.log('Ooops!', err) // likely the key was not found
//
//     // Ta da!
//     console.log('name=' + value)
// })
// console.log(db.isOpen())
// console.log(db.isClosed())