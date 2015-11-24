/**
 * Created by steimlfk on 08.07.15.
 */

var httpProxy = require('http-proxy');
var http = require('http');
var express = require('express');
var passport = require('passport'),
    jwt = require('jsonwebtoken'),
    bodyParser = require('body-parser'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    serveStatic = require('serve-static');


var cfg = require('./config.js')

var port = 3000;//parseInt(process.argv[2]);

var addresses = [
    {
        host: "localhost",
        port: 3001
    }
];

var app = express();
var proxy = httpProxy.createServer();
proxy.on('error', function(err, preq, pres){
    console.log(err.stack);
    console.log('BURP: ' + preq.method + ' '+ preq.originalUrl);
    pres.writeHead(500, { 'Content-Type': 'text/plain' });
    pres.write("Internal Server Error");
    pres.end();
});

function loadBalancer(req, res, next){
    req.url = req.originalUrl;
    req.headers.authorization = "APIKEY 1234";
    if (req.user) req.headers['x-echo-user'] = req.user.accountId;
    //
    // On each request, get the first location from the list...
    //
    var target = {target: addresses.shift()};
    //
    // ...then proxy to the server whose 'turn' it is...
    //
    console.log('balancing request to: ', target);
    proxy.web(req, res, target);
    //
    // ...and then the server you just used becomes the last item in the list.
    //
    addresses.push(target.target);
};

var streamBody = function (req, res, next) {
    if (req.method == 'PUT' ||req.method == 'POST') {
        req.removeAllListeners('data');
        req.removeAllListeners('end');
        if (req.headers['content-length'] !== undefined) {
            req.headers['content-length'] = Buffer.byteLength(JSON.stringify(req.body), 'utf8')
        }
        process.nextTick(function () {
            if (req.body) {
                req.emit('data', JSON.stringify(req.body))
            }
            req.emit('end')
        });
        next()
    }
    else next();
};


app.use(passport.initialize());

/*
 *  This Functions checks whether a token is valid
 *  If the token is valid, user data will be stored in req.user
 *
 *  to use this strategy apply passport.authenticate(['bearer'], { session: false }) to the stack
 */
passport.use(new BearerStrategy({"realm" : "ECHO REST-API"}, function(accessToken, done) {
    // check validity of given token using the secret
    jwt.verify(accessToken, cfg.tokensecret, function(err, decoded) {
        if (err) { return done(null, false); }

        // token was valid, data from retval will be stored in req.user
        var retval = {
            'accountId' : decoded.accountId,
            'role' : decoded.role
        };
        done(null, retval);

    });
}));
app.use( bodyParser.json());

app.get('/instances', function(req, res, next){
    res.send('instances', addresses);
});

app.post('/instances', function(req, res, next){
    addresses = req.body;
    console.log(addresses);
    res.send(200);
});


var echo_endpoints = ['/accounts', '/patients', '/questions','/notifications','/createPatientAndAccount','/changeDoctor', '/devices'];
var echo_middlewares = [passport.authenticate(['bearer'], { session: false })];

for (var i = 0; i< echo_endpoints.length; i++){
    app.use(echo_endpoints[i], echo_middlewares);
};
app.use(streamBody);
app.use(loadBalancer);

/**
 * Swagger UI
 */
//Serve up swagger ui at /docs via static route
var docs_handler = serveStatic(__dirname + '/docs/');
app.get(/^\/docs(\/.*)?$/, function(req, res, next) {
    if (req.url === '/docs') { // express static barfs on root url w/o trailing slash
        res.writeHead(302, { 'Location' : req.url + '/' });
        res.end();
        return;
    }
    // take off leading /docs so that connect locates file correctly
    req.url = req.url.substr('/docs'.length);
    return docs_handler(req, res, next);
});


http.createServer(app).listen(port);