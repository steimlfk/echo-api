/**
 * Config File for shared stuff about Passwords 
 */
var bcrypt = require('bcryptjs');


/**
 * Section about Database Users PW
 * 
 * This prefix is used to create the password for the database user. 
 * To create this password, the prefix is concatenated with the db userid.
 * 
 * The Function calculate pw concatenates a given userid with the prefix
 * to "calculate" the correct pw in order to connect to the db as the given user.
 * It is used by every Webservice-Endpoint that connects to the db on the behalf 
 * of a certain user.
 */
var prefix = "secret_";

exports.db_pw_prefix = prefix;

exports.calculatePW = function(i){
	return prefix+i.toString();
}

/**
 * Section Token Security
 * 
 * The provided secret is used to sign the tokens
 */

exports.tokensecret = "14m4v3rY5p3c1aL53cr37";



/**
 * Section about Account PW
 * 
 * This Functions are used to encrypt and compare the passwords of an account.
 * Used by OAuths create Token Function
 * 
 * source: http://stackoverflow.com/questions/14015677/node-js-encryption-of-passwords
 */
exports.cryptPassword = function(password, callback) {
	bcrypt.genSalt(10, function(err, salt) {
		if (err) 
			return callback(err);

		bcrypt.hash(password, salt, function(err, hash) {
			return callback(err, hash);
		});

	});
};

exports.comparePassword = function(password, hash, callback) {
	bcrypt.compare(password, hash, function(err, isPasswordMatch) {
		if (err) 
			return callback(err);
		return callback(null, isPasswordMatch);
	});
};