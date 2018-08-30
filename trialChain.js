/* This is a test version. Just trying to get the concept of writing a private blockchain accurate. */

// First we will import the needed modules

const SHA256 = require('crypto-js/sha256');
const level = require('level')
const chaindb = './trialchaindb';
const db = level(chaindb, {valueEncoding: 'json'})


var getChainLength = new Promise((resolve, reject) => {			
	var blockCount = 0;
	var stream = db.createReadStream();
	stream.on('data', function(block) {
		if(Object.keys(block).length > 0) {
			blockCount ++;
		}
	})
	stream.on('close', function() {
		resolve(blockCount);
	})
});



class Blockchain {
	constructor() {
		let genesisPromise = new Promise((resolve,reject) => { 
			getChainLength.then((blockCount) => {
				if(blockCount === 0) {
					let genesisBlock = {
						time: 0,
						height: 0,
						previousBlockHash: '',
						data: 'This is the genesis block of the chain',
						hash: ''
					}
					genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
					db.put(0, genesisBlock, function(err) {
						resolve('We succesffully created the blockchain and added a genesis block.')
					})
				}
				else {
					resolve('The blockchain already exists with a genesis block in it.')
				}
			});
		});
		genesisPromise.then((message) => {
			console.log(message);
		})
	}

	addBlock(newBlock) {
		let createBlockPromise = new Promise((resolve,reject) => {
			getChainLength.then((blockCount) => {
				let chainHeight = blockCount - 1;
				db.get(chainHeight, function(err, value) {
					if (err) { 
						resolve('Could not get the block because we received an error.')
					}
					else { 
						resolve(value)
					}
				})
			})
		})
		createBlockPromise.then((value) => {
			newBlock.time = new Date().getTime().toString().slice(0,-3);
			newBlock.height = value.height + 1
			newBlock.previousBlockHash = value.hash;
			newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
			db.put(newBlock.height, newBlock, function(err) {
				console.log(`We added the block to the blockchain.`)
			})
		})
	}

	getHeight() {
		getChainLength.then((blockCount) => {
			let chainHeight = blockCount - 1;
			console.log(chainHeight);
		})
	}

	getBlock(height) {
		let getBlockPromise = new Promise((resolve,reject) => { 
			db.get(height, function(err, value) {
				if(err) {
					console.log('We were unable to get the block due to some error.')
				}
				else {
					resolve(value);
				}
			});
		});
		getBlockPromise.then((value) => {
			console.log(value);
			return value
		})
	}

	validateBlock(height){
		db.get(height, function(err, value) {
			let blockHash = value.hash;
			value.hash = '';
			let validHash = SHA256(JSON.stringify(value)).toString();
			if(validHash === blockHash) {
				console.log(`Block #${value.height} is valid.`)
				return true;
			}
			else {
				console.log(`WARNING: Block #${value.height} is not valid!`);
				return false
			}
		})
	}

	validateChain() {
		// This should be done by iteration versus storing the whole stream... but for now it works..
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

class Block {
	constructor(data) {
		this.previousBlockHash = '';
		this.time = 0;
		this.height = 0;
		this.body = data;
		this.hash = '';
    } 
}

let firstChain = new Blockchain();

// // 1. =========== Adding a new block to the blockchain.
// firstChain.addBlock(new Block('And we are adding some more data onto the blockchain.'));

// // 2. =========== Console.log the chain of blocks
// var stream = db.createReadStream();
// let chain = [];
// 	stream.on('data', function(block) {
// 		chain.push(block);
// 	});
// 	stream.on('close', function() {
// 		console.log(chain);
// })

// // 3. =========== Get height
// firstChain.getHeight();

// // 4. =========== Get block object
// firstChain.getBlock(2);

// // 5. =========== Get block object
// firstChain.validateBlock(2); 

// // 6. =========== Delete a block
// db.del(#)

// 7. =========== Hacking the blockchain, 
// 1) setting a false hash value and 
// 2) setting a changin some of the data stored in the block.

// // 8. =========== Validating the entire chain, 
// firstChain.validateChain();