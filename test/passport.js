var Passport = artifacts.require("./Passport.sol");

contract("Passport", function(accounts) {
  var passportInstance;

  it("initializes with one voter", function() {
    return Passport.deployed().then(function(instance) {
      return instance.votersCount();
    }).then(function(count) {
      assert.equal(count, 1);
    });
  });

  it("it initializes the voters with the correct values", function() {
    return Passport.deployed().then(function(instance) {
      passportInstance = instance;
      return passportInstance.voters(accounts[0]);
    }).then(function(voter) {
      assert.equal(voter[0], accounts[0], "contains the correct id");
      assert.equal(voter[1], "Sara", "contains the correct first name");
      assert.equal(voter[2], "Cohneour", "contains the correct last name");
      assert.equal(voter[3], 42, "contains the correct age");
    });
  });

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

   it("add new non valid voter", function() {
    return Passport.deployed().then(function(instance) {
      passportInstance = instance;
      return instance.register("New", "Voter", 17, {from: accounts[1]});
  }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      assert(error.message, "Voter must be at least 18 years old");
    })
  });

  it("register same voter twice, error", function() {
    return Passport.deployed().then(function(instance) {
      passportInstance = instance;
      return instance.register("New", "Voter", 42, {from: accounts[0]});
 }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    })
  });
});