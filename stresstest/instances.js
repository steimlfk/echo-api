var should = require('should');
var assert = require('assert');
var request = require('supertest');
var async = require('async');
var config = require('./config.js');
var url = config.url;
var addresses = process.argv[2];

/*
 var addresses = [
 {
 host: "localhost",
 port: 3001
 }
 ];
 */

async.waterfall([
    function(cb){
        var result = [];
        var hosts = addresses.split(",");
        console.log(hosts);
        for (var i = 0; i < hosts.length; i++) {
            var host = hosts[i];
            var tmp = host.split(":");
            var a = {
                host: tmp[0],
                port: tmp[1]
            };
            result.push(a);
        }
        cb(null, result);
    },
    function(input, cb){

        request(url)
            .post('/instances')
            .set('Authorization', 'APIKEY ' + config.apiKey)
            .send (input)
            .expect(200)
            .end(function (err, res){
                if (err) throw err;
                cb();
            });

        cb(null, input);
    }
], function (err, res){

});

