var Election = artifacts.require("./Election.sol");
var Passport = artifacts.require("./Passport.sol");

module.exports = function(deployer) {
  deployer.deploy(Election);
  deployer.deploy(Passport);
};