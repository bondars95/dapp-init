var Election = artifacts.require("./Election.sol");
var Passport = artifacts.require("./Passport.sol");

contract("Election", function(accounts) {
  var electionInstance;
  var passportInstance;

it("add new voter", function() {
    return Passport.deployed().then(function(instance) {
      passportInstance = instance;
      instance.register("New", "Voter", 42, {from: accounts[1]});
      return instance.votersCount();
    }).then(function(count) {
      assert.equal(count, 2);
      return passportInstance.voters(accounts[1]);
    }).then(function(voter) {
      assert.equal(voter[0], accounts[1], "contains the correct id");
      assert.equal(voter[1], "New", "contains the correct first name");
      assert.equal(voter[2], "Voter", "contains the correct last name");
      assert.equal(voter[3], 42, "contains the correct age");
    });
  });

  it("initializes with two candidates", function() {
    return Election.deployed().then(function(instance) {
      return instance.candidatesCount();
    }).then(function(count) {
      assert.equal(count, 2);
    });
  });

  it("add new candidate", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      instance.addCandidate("Candidate 3");
      return instance.candidatesCount();
    }).then(function(count) {
      assert.equal(count, 3);
      return electionInstance.candidates(3);
    }).then(function(candidate) {
      assert.equal(candidate[0], 3, "contains the correct id");
      assert.equal(candidate[1], "Candidate 3", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
    });
  });

  it("add new candidate require owner", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      return instance.addCandidate("Candidate 4", {from: accounts[1]});
    }).then(assert.fail).catch(function(error) {
      assert(error.message, "Sender not authorized. Please contact contact owner for adding new candidates.");
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    })
  });


  it("it initializes the candidates with the correct values", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidates(1);
    }).then(function(candidate) {
      assert.equal(candidate[0], 1, "contains the correct id");
      assert.equal(candidate[1], "Candidate 1", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
      return electionInstance.candidates(2);
    }).then(function(candidate) {
      assert.equal(candidate[0], 2, "contains the correct id");
      assert.equal(candidate[1], "Candidate 2", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
    });
  });

  it("allows a voter to cast a vote", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      candidateId = 1;
      return electionInstance.vote(candidateId, { from: accounts[0] });
    }).then(function(receipt) {
      return electionInstance.voters(accounts[0]);
    }).then(function(voted) {
      assert(voted, "the voter was marked as voted");
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 1, "increments the candidate's vote count");
    })
  });

  it("throws an exception for invalid candidates", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.vote(99, { from: accounts[1] })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return electionInstance.candidates(1);
    }).then(function(candidate1) {
      var voteCount = candidate1[2];
      assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
      return electionInstance.candidates(2);
    }).then(function(candidate2) {
      var voteCount = candidate2[2];
      assert.equal(voteCount, 0, "candidate 2 did not receive any votes");
    });
  });

  it("throws an exception for double voting", function() {
    return Election.deployed().then(function(instance) {
      electionInstance = instance;
      candidateId = 2;
      electionInstance.vote(candidateId, { from: accounts[1] });
      return electionInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 1, "accepts first vote");
      // Try to vote again
      return electionInstance.vote(candidateId, { from: accounts[1] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return electionInstance.candidates(1);
    }).then(function(candidate1) {
      var voteCount = candidate1[2];
      assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
      return electionInstance.candidates(2);
    }).then(function(candidate2) {
      var voteCount = candidate2[2];
      assert.equal(voteCount, 1, "candidate 2 did not receive any votes");
    });
  });

  it("throws an exception for unknown voter", function() {
    return Election.deployed().then(function(instance) {
      return electionInstance.vote(candidateId, { from: accounts[2] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      assert(error.message, "No passport info provided by voter");
      return electionInstance.candidates(1);
    });
  });

  it("vote after voting closed", function() {
    return Passport.deployed().then(function(instance) {
      passportInstance = instance;
      instance.register("New", "Voter", 42, {from: accounts[2]});
      electionInstance.closeVoting({ from: accounts[0] });
      return electionInstance.vote(candidateId, { from: accounts[2] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      assert(error.message, "Sorry but voting is closed");
    });
  });
});