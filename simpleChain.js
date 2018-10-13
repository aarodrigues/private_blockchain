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
      this.chain(0)
      .then((value)=>{
        console.log('Blockchain loaded.');
      })
      .catch((err)=>{
        console.log("First Block created.");
        this.addBlock(new Block("First block in the chain - Genesis block"));
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
        return new Promise((resolve, reject) => {
          levelSandbox.lastRegister()
          .on('data', function(data) {
              resolve(JSON.parse(data.value).height);
          }).on('error', function(err) {
              reject(err);
              return console.log('Unable to read data stream!', err); 
          });
        });
      }

      // get block
      getBlock(blockHeight,print){
        if(print){
         this.chain(blockHeight)
         .then((value)=>{
           console.log(JSON.parse(value));
         });
        }else{
          return this.chain(blockHeight);
        }
      }

      // validate block
      validateBlock(blockHeight){
        return new Promise((resolve, reject) => {
          let print = false; 
          // get block object
          this.getBlock(blockHeight,print)
          .then((value)=>{
            let block = JSON.parse(value);
            // get block hash
            let blockHash = block.hash;
            // remove block hash to test block integrity
            block.hash = '';
            // generate block hash
            let validBlockHash = SHA256(JSON.stringify(block)).toString();
              // Compare
            if (blockHash===validBlockHash) {
              resolve(true);
            }else{
              console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
              reject(false);
            }
          })
          .catch((err)=>{
            if (err) return console.log('Not found!', err);
          });
        });
      }

    // Validate blockchain
      validateChain(){
        let errorLog = [];
        let promises = [];
        this.getBlockHeight()
        .then((height)=>{
          for (var i = 0; i <= height; i++) {
            
            promises.push(this.getBlock(i)
            .then((value)=>{
              return JSON.parse(value); 
            }).catch((err)=>{
              if (err) return console.log('first Not found!', err);
            }));
          }
          // Interacting through all promises
          Promise.all(promises)
          .then((array)=>{
            for(i = 0; i<array.length-1; i++){

              this.validateBlock(array[i].height).then((valid)=>{
                if (!valid) errorLog.push(i);
              });
               let blockHash = array[i].hash;
               let previousHash = array[i+1].previousBlockHash;
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
          }).catch((err)=>{
            console.log("Error: "+err);
          });

        }).catch((err)=>{
          console.log(err);
        });
      }
  }


