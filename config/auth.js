//var redis                   = require('./redis.js').redis; 
var db 						= require('./mysql.js').db;
var jwt 					= require('jsonwebtoken');
var passport                = require('passport');
var BasicStrategy           = require('passport-http').BasicStrategy;
var BearerStrategy          = require('passport-http-bearer').Strategy;

var tokensecret = "14m4v3rY5p3c1aL53cr37";

passport.use(new BearerStrategy({"realm" : "ECHO REST-API"},
		function(accessToken, done) {
	jwt.verify(accessToken, tokensecret, function(err, decoded) {
		if (err) { return done(null, false); }
//		redis.hget('users:'+decoded.accountId, 'token', function(err, result){
//		if (err) return done(err);
//		if (result != accessToken){ return done(null, false); }
		var retval = {'accountId' : decoded.accountId,
				'username' : decoded.username,
				'role' : decoded.role,
		};
		done(null, retval);
//		});
	});
}));

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

