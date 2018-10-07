/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
let levelSandbox = require('./levelSandbox');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.chain = levelSandbox.getLevelDBData,
    this.hasPrevious = false;
    this.chain(0)
    .then((value)=>{
      console.log('Value = ' + value);
      this.hasPrevious = true;
    })
    .catch((err)=>{
      console.log("First Block created.");
      this.addBlock(new Block("First block in the chain - Genesis block"));
      this.hasPrevious = true;
    });
  }

  // Add new block
  addBlock(newBlock){
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    //get last Register from db
    levelSandbox.lastRegister()
      .on('data', function(data) {
        // Block height
        newBlock.height =  JSON.parse(data.value).height+1;
      }).on('error', function(err) {
          return console.log('Unable to read data stream!', err);
      }).on('close', function() {
          
          if(newBlock.height>0){  
            //async fucntion to get previous block  
            levelSandbox.getLevelDBData(newBlock.height-1).then((value)=>{
              // previous block hash
              newBlock.previousBlockHash = JSON.parse(value).hash;
              // Block hash with SHA256 using newBlock and converting to a string
              newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
              // Save in leveldb
              levelSandbox.addDataToLevelDB(JSON.stringify(newBlock));
            });     
          }else{
            // Block hash with SHA256 using newBlock and converting to a string
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            // Save in leveldb
            levelSandbox.addDataToLevelDB(JSON.stringify(newBlock));
          }
      });
  }

  // Get block height
    getBlockHeight(){
      levelSandbox.lastRegister()
      .on('data', function(data) {
          console.log('Height: ' + JSON.parse(data.value).height);
      }).on('error', function(err) {
          return console.log('Unable to read data stream!', err);
      });
    }

    // get block
    getBlock(blockHeight){
      this.chain(blockHeight)
      .then((value)=>{
        console.log(JSON.parse(value));
      })
      .catch((err)=>{
        if (err) return console.log('Not found!', err);
      });
    }

    // validate block
    validateBlock(blockHeight){
      // get block object
      let block = this.getBlock(blockHeight);
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash===validBlockHash) {
          return true;
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          return false;
        }
    }

   // Validate blockchain
    validateChain(){
      let errorLog = [];
      for (var i = 0; i < this.chain.length-1; i++) {
        // validate block
        if (!this.validateBlock(i))errorLog.push(i);
        // compare blocks hash link
        let blockHash = this.chain[i].hash;
        let previousHash = this.chain[i+1].previousBlockHash;
        if (blockHash!==previousHash) {
          errorLog.push(i);
        }
      }
      if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
      } else {
        console.log('No errors detected');
      }
    }
}


