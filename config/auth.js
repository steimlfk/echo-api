/**
 * Auth.js
 * This File is all about checking whether a Token is valid or not
 */

var db 						= require('./mysql.js').db;
var jwt 					= require('jsonwebtoken');
var passport                = require('passport');
var BasicStrategy           = require('passport-http').BasicStrategy;
var BearerStrategy          = require('passport-http-bearer').Strategy;
var config 				= require('../config/config.js');

//get Secret which is used to sign the token
var tokensecret = config.tokensecret;


/*
 *  This Functions checks whether a token is valid
 *  If the token is valid, user data will be stored in req.user
 *  
 *  to use this funtion apply passport.authenticate(['bearer'], { session: false }) to the stack
 */
passport.use(new BearerStrategy({"realm" : "ECHO REST-API"}, function(accessToken, done) {
	// check validity of given token using the secret
	jwt.verify(accessToken, tokensecret, function(err, decoded) {
		if (err) { return done(null, false); }
		
		// token was valid, data from retval will be stored in req.user
		var retval = {'accountId' : decoded.accountId,
				'role' : decoded.role,
		};
		done(null, retval);

	});
}));

/*
 *  This is code for Webdemo Application
 *  These Methods serialize and deserialize the Users Session in which the token is stored
 */
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

