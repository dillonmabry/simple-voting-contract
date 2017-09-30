// Get contract from Node Server
$.get('/contract', function(data) {

// Setup Web3 development and Application Binary Interface with our voting contract 
Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
abi = JSON.parse('[{"constant":false,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"totalVotesFor","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"validCandidate","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"votesReceived","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"x","type":"bytes32"}],"name":"bytes32ToString","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"candidateList","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"voteForCandidate","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"contractOwner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"inputs":[{"name":"candidateNames","type":"bytes32[]"}],"payable":false,"type":"constructor"}]')
VotingContract = web3.eth.contract(abi);

contractInstance = VotingContract.at(data);
candidates = {"Rama": "candidate-1", "Nick": "candidate-2", "Jose": "candidate-3"}
accounts = contractInstance._eth.accounts;
currentAccount = accounts[Math.floor(Math.random()*(9-0+1)+0)]
transactionsList = [];

function voteForCandidate(name) {
  
  var candidateName = name;
  contractInstance.voteForCandidate(candidateName, {from: currentAccount}, function() {
    let div_id = candidates[candidateName];
    let voteCount = contractInstance.totalVotesFor.call(candidateName).toString();
    $("#" + div_id).html(voteCount);
    let transCount = contractInstance._eth.getTransactionCount(currentAccount);
    $("#"+ currentAccount).html(transCount);    
    let block = contractInstance._eth.getBlock(contractInstance._eth.blockNumber)
    let transactionId = block.transactions[0];
    let time = new Date(block.timestamp*1000);
    toastr.info('Vote tallied! Your transaction ID: '+transactionId);
    $("#transactions-record").prepend(
      "<tr>"+
          "<td>"+time+"</td>"+
          "<td id='"+transactionId+"'>"+transactionId+"</td>"+
        "</tr>"
    );
    if(contractInstance._eth.blockNumber >= 10) {
       $("#transactions-record tr:last").remove();
    }
  });
}

function displayRecentTransactions() {
   //Display last 10 transactions
   for(var i=0; i < 10; i++) {
    var block = contractInstance._eth.getBlock(contractInstance._eth.blockNumber -i);
    if(block == null) {
         $("#undefined").html("null");
	 return;
    }
    var transactionId = block.transactions[0]
    var time = new Date(block.timestamp*1000);
    $("#transactions-record").append(
      "<tr>"+
          "<td>"+time+"</td>"+
          "<td id='"+transactionId+"'>"+transactionId+"</td>"+
        "</tr>"
    );
   }
}

function getAllTransactions() {
  const date = new Date("January 1, 1970 12:00:00");
  const minTimestamp = date.setHours(date.getHours()) / 1000;

  const {currentBlock, highestBlock} = web3.eth.syncing;
  if(currentBlock < highestBlock) {
    console.log('Warning! Node is not synced:\n', web3.eth.syncing);
  }
  let blockNum = web3.eth.blockNumber;

  while(true) {
    const block = web3.eth.getBlock(blockNum);
    if(block == null) break;
    if(block.timestamp < minTimestamp) break;
    let transaction = block.transactions[0];
    let timestamp = new Date(block.timestamp*1000);
    transactionsList.push({
      transactionid: transaction,
      time: timestamp,
      blockid: block.hash,
      gasUsed: block.gasUsed
    });
    --blockNum;
  }
 
}

function displayCandidates() {
  //Show the candidates and vote counts
  candidateNames = Object.keys(candidates);
  for (var i = 0; i < candidateNames.length; i++) {
    let name = candidateNames[i];
    let val = contractInstance.totalVotesFor.call(name).toString()
    $("#" + candidates[name]).html(val);
  }
}

function displayTransactionCounts() {
  //Update the transaction counter for each Account
  for(var i=0; i < accounts.length; i++) {
    let count = contractInstance._eth.getTransactionCount(accounts[i]);
    let accNo = accounts[i];
    $("#transactions").append(
      "<tr>"+
          "<td>"+accNo+"</td>"+
          "<td id='"+accNo+"'>"+count+"</td>"+
        "</tr>"
    );
  }
}

$(document).ready(function() {

  $("#currentAccount").html("Your Account: <strong>"+currentAccount+"</strong");
 
  displayCandidates();

  displayTransactionCounts();

  displayRecentTransactions();

  getAllTransactions();

  $("#searchForm").submit(function(event) {
    $.each(transactionsList, function(i, val) {
      if(val.transactionid == $("#searchInput").val()) {
         $("#modal").modal();
         $(".modal-body").html("Transaction ID: <br/>"+"<li class='list-group-item'><strong>"+val.transactionid+"</strong></li>"+
         "<br/>Timestamp: <br/>"+"<li class='list-group-item'><strong>"+val.time+"</strong></li>"+
         "<br/>Block ID: <br/>"+"<li class='list-group-item'><strong>"+val.blockid+"</strong></li>"+
         "<br/>Gas Used: <br/>"+"<li class='list-group-item'><strong>"+val.gasUsed+"</strong></li>"
        );
      }
    }); 
    event.preventDefault();
  });

  var name;
  $(".table tr").click(function(){
	//Get the candidate name based on table selection
        $(this).find("td").each(function(){
            var $tr = $(this).closest('tr');
	    $('.table').find('tr.active').removeClass('active');
            $tr.addClass('active');
            name = $tr.find('td:first').text();
        });
  });

  //Vote submission
  $("#voteButton").click(function(event) {	
      event.preventDefault();
      if(!name) {
	alert('Hey, select a candidate to vote for!')
      }
      voteForCandidate(name);
  });

});

});

