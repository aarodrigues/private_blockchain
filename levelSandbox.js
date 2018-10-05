/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

module.exports = {printTest, addLevelDBData, getLevelDBData, addDataToLevelDB, getAllData}

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

function printTest(){
  console.log("Ve se funciona!");
}

// Add data to levelDB with key/value pair
function addLevelDBData(key,value){
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
}

// Get data from levelDB with key
function getLevelDBData(key){
  db.get(key, function(err, value) {
    if (err) return console.log('Not found!', err);
    console.log('Value = ' + typeof value);
  });
  return JSON.parse(value);
}

// Add data to levelDB with value
function addDataToLevelDB(value) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          console.log('Block #' + i);
          addLevelDBData(i, value);
        });
}

list = [];
// get all data
function getAllData() {
  db.createReadStream().on('data', function(data) {
        list.push(JSON.parse(data.value));
      }).on('error', function(err) {
          return console.log('Unable to read data stream!', err)
      }).on('close', function() {
        console.log('List: ' + list);
      });
  return list;
}

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/


// (function theLoop (i) {
//   setTimeout(function () {
//     addDataToLevelDB('Testing data');
//     if (--i) theLoop(i);
//   }, 100);
// })(10);
