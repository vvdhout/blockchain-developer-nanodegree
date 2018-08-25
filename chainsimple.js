/* notes.txt

What do we need in order to create a blockchain?
- A blockchain to add blocks to
- Blocks to add to the blockchain
- A dataset to persist the data */


/* <======== Importing the necessary modules =========> */

const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chaindb'; //Create a directory to store the blockchain
const db = level(chainDB, { valueEncoding: 'json'}); // Connect to the directory using levelcb

/* <======== Creating a blockchain =========>  */

class Blockchain {
	constructor(chainName) {
		var chain = [];
		var stream = db.createReadStream();
		stream.on('data', function(block) {
			chain.push(block.value)
		})
		stream.on('close', function () {
			if(chain.length === 0) {
				const genesisBlock = { // Create a genesis block when creating the blockchain
					height: 0,
					time: 0,
					previousBlockHash: "",
					body: "This is the genesis block of the blockchain.",
					hash: ""
				}
				genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
			
				db.put(0, genesisBlock, function(err) { // Add the genesis block to the db
					console.log('We succesfully created and added a genesis block')
				})
			}
			else {
				console.log('A blockchain already exists in our Leveldb database.')
			}
		})	
	}

	addBlock(newBlock) {
		var chain = [];
		var stream = db.createReadStream();
		stream.on('data', function(block) {
			chain.push(block.value)
		})
		stream.on('close', function () {
			newBlock.height = chain.length; 
			newBlock.time = new Date().getTime().toString().slice(0,-3); 
			if (chain.length > 0 ) {
				newBlock.previousBlockHash = chain[chain.length - 1].hash; 
			}
			newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
			db.put(newBlock.height, newBlock, function (err) {
					console.log("We have added block #" + newBlock.height + " to our Blockchain.");
			})
		})
	}

	getBlockHeight() {
		var getHeightPro = new Promise((resolve, reject) => {
			var chainHeight = 0;
			var chain = [];
			var stream = db.createReadStream();
			stream.on('data', function(block) {
				chain.push(block.value)
			})
			stream.on('close', function () {
				resolve(chain.length - 1)
			})
		})
		getHeightPro.then((height) => {
			console.log(height)
			return height;
		})
	}

	getBlock(height) {
		var getBlockPromise = new Promise( (resolve, reject) => {
			var blockObject = {};
			var chain = [];
			var stream = db.createReadStream();
			stream.on('data', function(block) {
				chain.push(block.value)
			})
			stream.on('close', function () {
				blockObject = chain[height];
				resolve(blockObject);
			}) 	
		})
		getBlockPromise.then((blockObject) => {
			return blockObject;
		})
		
	}


	// validate block
    validateBlock(blockHeight){

    	var getBlockPromise = new Promise( (resolve, reject) => {
    		var blockObject = {};
			var chain = [];
			var stream = db.createReadStream();
			stream.on('data', function(block) {
				chain.push(block.value)
			})
			stream.on('close', function () {
				blockObject = chain[blockHeight];
				resolve(blockObject);
			}) 	
    	})
    	getBlockPromise.then((blockObject) => {
    		  let block = blockObject
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
    	})
    }


   // Validate blockchain
    validateChain(){
        
        var getChainPromise = new Promise((resolve, reject) => {
	        var chain = [];
			var stream = db.createReadStream();
			stream.on('data', function(block) {
				chain.push(block.value)
			})
			stream.on('close', function () {
				resolve(chain);
		    })
		})
		getChainPromise.then((chain) => {
			var errorLog = [];
			for (var i = 0; i < chain.length-1; i++) {
	        // validate block
	        var returnValidationPr = new Promise ((resolve, reject) => {
	        	resolve(this.validateBlock(i))
	        })
	        returnValidationPr.then((valid) => {
	        	if (!valid)errorLog.push(i);
	        })
	        // compare blocks hash link
	        let blockHash = chain[i].hash;
	        let previousHash = chain[i+1].previousBlockHash;
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
		})	
    }

}


/* <======== Creating a block =========> */

class Block {
	constructor(data) {
		this.height = 0;
		this.time = 0;
		this.hash = "";
		this.previousBlockHash = "";
		this.body = data;
	}
}



/* <======== Below are snippets of code that can be run with different goals in mind. It is important to note that all functions excpet the one to create a blockchain need to be run after initializing the blockchain.
This because the functions it calls on are callback functions that need to be finished before running these. 
1) Set up the blockchain
2) Add a new block
3) Stream and log the current blockchain that is stored
4) Get the current height of the blockchain
5) Get a block object using the height as argument
 =========> */


/* <==== 1) Set up the blockchain / Connect to blockchain ====> */

newChain = new Blockchain('newChain');


/* <==== 2) Add block to the chain ====> */

let blockToAdd = (data) => {
	newChain.addBlock(new Block(data));
};

// blockToAdd('Just some placeholder data to see if it gets added to the block at the right position.')


/* <==== 3) Log out the current chain ====> */

// var chain = [];
// var stream = db.createReadStream();
// stream.on('data', function(block) {
// 	chain.push(block.value)
// })
// stream.on('close', function () {
// 	console.log(chain)
// })


// newChain.getBlockHeight();

// newChain.validateBlock(3);

// newChain.validateChain();

// blockToAdd('Faulty previous block hash in order to test validateChain'); // This was adding a block when the previous hash would be set to that of 2 blocks earlier instead of 1 block earlier.
