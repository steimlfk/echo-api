/**
 * Auth.js
 * This File is all about creating (refresh-) tokens
 */

var oauth2orize         = require('oauth2orize');
var passport            = require('passport');
var db					= require('./mysql').db;
var jwt 				= require('jsonwebtoken');
var swagger 			= require('swagger-node-express');
var HashMap 			= require('hashmap').HashMap;
var utils 				= require('../config/utils.js');
var config 				= require('../config/config.js');

//create OAuth 2.0 server which will create the tokens
var server = oauth2orize.createServer();

//get Secret which is used to sign the token
var tokensecret = config.tokensecret;

//create the Hashmap which stores the refresh tokens
var hm = new HashMap();

/*
 * OAuth: Ressource Owner Password Credentials FLow
 * Exchange username & password for access token.
 */
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
	db.getConnection(function(err, connection) {
		if (err) {
			res.statusCode = 500;
			res.send({err: 'Internal Server Error'}); 
		} else {
			// Call the SP login() 
			// it checks whether a enabled account with the given username exists
			connection.query('CALL login(?)', username, function(err, rows) {
				// db error?
				if (err) {  return done(err); }
				// no user found?
				if (rows[0].length == 0) {  return done(null, false);  }

				// passwort check ()
				config.comparePassword(password, rows[0][0].password, function(err, match){
					if (err) {  return done(err); }

					// password matches the hash?
					if (match){
						// user was found & token is created
						var tokencontent = {
								'accountId' : rows[0][0].accountId,
								'role' : rows[0][0].role,
						};

						// create refresh token and store it into the hashmap (value: userdata from database)
						var refreshTokenValue = utils.uid(128);
						hm.set(refreshTokenValue, rows[0][0].accountId);

						// create token as json web token
						var token = jwt.sign(tokencontent, tokensecret, {"expiresInMinutes": 10080});
						done(null, token, null, { 'expires_in': '10080', 'role': rows[0][0].role, 'accountId' : rows[0][0].accountId, 'refreshToken': refreshTokenValue});
					}
					// password doesnt match the hash -> fail
					else return done(null, false); 
				})
				connection.release();
			});
		}
	});

}));



/*
 * OAuth: Refresh Token Handling
 * xchange refreshToken for access token.
 */
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
	// is the given refresh token member of the hashmap?
	if (hm.has(refreshToken)){
		// get userdata connected to this token from the hashmap
		var usr = hm.get(refreshToken);
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on login: ',err);
				res.statusCode = 500;
				res.send({err: 'Internal Server Error'}); 
			} else {
				// check if account is still active!
				connection.query('CALL loginRefresh(?)', usr, function(err, rows) {
					if (err) {  return done(err); }
					// not active? -> fail auth
					if (rows[0].length == 0) {  return done(null, false);  }
					
					// still active - create new token and new refresh token
					var tokencontent = {
							'accountId' : rows[0][0].accountId,
							'role' : rows[0][0].role,
					};
					// delete the used refresh token -> refresh tokens are one-way-pwds
					hm.remove(refreshToken);
					var refreshTokenValue = utils.uid(128);
					hm.set(refreshTokenValue, rows[0][0].accountId);
					var token = jwt.sign(tokencontent, tokensecret, {"expiresInMinutes": 10080});
					done(null, token, null, { 'expires_in': '10080', 'role': rows[0][0].role, 'accountId' : rows[0][0].accountId, 'refreshToken': refreshTokenValue});

					connection.release();
				});
			}
		});

	}
	// given refresh token isnt part of the hashmap -> auth fail
	else return done(null, false);
}));

exports.endpoint = server.token();
exports.errorHandler = server.errorHandler();

exports.loginSpec = {
		summary : "Login with OAuth2 (Strategy: Ressource Owner Password Credentials)",
		notes : "Returns a token, which is needed to authenticate against all other API-Methods (Header: Authorization: Bearer [token]).",
		path : "/login",
		method: "POST",
		nickname : "login",
		parameters : [swagger.formParam("grant_type", "OAuth2 Granttype.", "string", true, ["password", "refresh_token"],"password"),
		              swagger.formParam("username", "Username for Granttype = password", "string", false),
		              swagger.formParam("password", "Password for Granttype = password", "string", false),
		              swagger.formParam("refresh_token", "Refresh Token for Granttype = refresh_token", "string", false)],

};