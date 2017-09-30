// DEPENDENCIES
var sys = require('util')
var express = require('express');
var app = express();
Web3 = require('web3');
var fs = require('fs');
solc = require('solc');
var contract_address;

//SETUP LOCAL WEB DAPP
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
code = fs.readFileSync('Voting.sol').toString()
compiledCode = solc.compile(code)

//SETUP ABI DEF AND SMART CONTRACT
abiDefinition = JSON.parse(compiledCode.contracts[':Voting'].interface)
VotingContract = web3.eth.contract(abiDefinition)
byteCode = compiledCode.contracts[':Voting'].bytecode;
deployedContract = VotingContract.new(['Rama','Nick','Jose'],{data: byteCode, from: web3.eth.accounts[0], gas: 4700000},
  function(e, contract) {
    if(!e) {
        if(!contract.address) {
            console.log("Contract TransactionHash: " + contract.transactionHash + " waiting to be mined...");
        } else {
            console.log("Contract mined! Address: " + contract.address);
	    contract_address = contract.address
            return true;
        }
    }
  }
);

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/'))

app.get('/', function(request, response) {
  response.sendfile(__dirname + '/index.html')
});

app.get('/contract', function(request, response) {
  response.send(contract_address);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
