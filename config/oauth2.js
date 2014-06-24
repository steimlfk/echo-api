var oauth2orize         = require('oauth2orize');
var passport            = require('passport');
//var redis 				= require('./redis').redis;
var db					= require('./mysql').db;
var jwt 				= require('jsonwebtoken');
var swagger 			= require('swagger-node-express');

// create OAuth 2.0 server
var server = oauth2orize.createServer();
var tokensecret = "14m4v3rY5p3c1aL53cr37";
// Exchange username & password for access token.

server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on login: ',err);
			res.send(503);
		} else {
			connection.query('SELECT * FROM accounts where username='+db.escape(username), function(err, rows) {
				if (err) { return done(err); }
				if (rows.length == 0) { return done(null, false);  }
				if (password != rows[0].password) { return done(null, false); }
				var tokencontent = {
						'accountId' : rows[0].accountId,
						'username' : rows[0].user,
						'role' : rows[0].role,
				};
//				redis.hdel('users:'+ rows[0].accountId, 'token', redis.print);

				var token = jwt.sign(tokencontent, tokensecret, {"expiresInMinutes": 10080});

//				redis.hset('users:'+ rows[0].accountId, 'token', token, redis.print);
				done(null, token, null, { 'expires_in': '10080', 'role': rows[0].role, 'accountId' : rows[0].accountId });
				
				connection.release();
			});
		}
	});

}));

exports.loginSpec = {
		summary : "Login with OAuth2 (Strategy: Ressource Owner Password Credentials)",
		notes : "Returns a token, which is needed to authenticate against all other API-Methods (Header: Authorization: Bearer [token]).",
		path : "/login",
		method: "POST",
		nickname : "login",
		parameters : [swagger.formParam("grant_type", "OAuth2 Granttype. Dont Change!", "string", "true", null,"password"),swagger.formParam("username", "Username", "string"),swagger.formParam("password", "Password", "string")],

	};

// Exchange refreshToken for access token.
//
//server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
//    RefreshTokenModel.findOne({ token: refreshToken }, function(err, token) {
//        if (err) { return done(err); }
//        if (!token) { return done(null, false); }
//        if (!token) { return done(null, false); }
//
//        UserModel.findById(token.userId, function(err, user) {
//            if (err) { return done(err); }
//            if (!user) { return done(null, false); }
//
//            RefreshTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
//                if (err) return done(err);
//            });
//            AccessTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
//                if (err) return done(err);
//            });
//
//            var tokenValue = crypto.randomBytes(32).toString('base64');
//            var refreshTokenValue = crypto.randomBytes(32).toString('base64');
//            var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: user.userId });
//            var refreshToken = new Re freshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: user.userId });
//            refreshToken.save(function (err) {
//                if (err) { return done(err); }
//            });
//            var info = { scope: '*' }
//            token.save(function (err, token) {
//                if (err) { return done(err); }
//                done(null, tokenValue, refreshTokenValue, { 'expires_in': config.get('security:tokenLife') });
//            });
//        });
//    });
//}));

exports.endpoint = server.token();
exports.errorHandler = server.errorHandler();