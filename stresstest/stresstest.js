var benchrest = require('bench-rest');
var async = require('async');

var cfg = require('./config.js');
var data = require('./data.js');

var url = cfg.url;
var usr = cfg.admin_username;
var pwd = cfg.admin_pwd;
var runOptions = cfg.runOptions;
var tok = null;
var doc_id = null;
var patients = [];
var ctr = 0;
var reportCtr = 0;
var p = cfg.runOptions.iterations / (cfg.runOptions.iterations * cfg.alertPercentage);

var saveToken = function(all){
    if (all.body.role == 'admin') tok = all.body.access_token;
    else if (all.iterCtx) {
        all.iterCtx.token = all.body.access_token;
        all.iterCtx.accountId = all.body.accountId;
    }
    return all;
};

var addAuthHeader = function(all){
    var t = tok;
    if (all.iterCtx) if (all.iterCtx.token) t = all.iterCtx.token;
    all.requestOptions.headers['Authorization'] = 'Bearer ' + t;
    return all;
};

var saveDocID = function(all){
    var doc_url = all.response.headers.location;
    doc_id = parseInt(doc_url.split("/").pop());
    data.patientsData.doctorId = doc_id;
    return all;
};

var savePatientID = function(all){
    var pat_url = all.response.headers.location;
    all.iterCtx.patientId = parseInt(pat_url.split("/").pop());
    patients.push(all.iterCtx.patientId);
    return all;
};

var injectPatientIdIntoData = function(all){
    all.requestOptions.json = true;
    var tmp = data.patientsData;
    tmp.accountId = all.iterCtx.patientId;
    tmp.socialId = 'mocha-'+tmp.accountId;
    tmp.fileId = tmp.socialId;
    all.requestOptions.body = tmp;
    return all;
};

var injectDailyReportData = function(all){
    all.requestOptions.json = true;
    var tmp = data.generateReport(((reportCtr++) % p)==0);
    all.requestOptions.body = tmp;
    all.requestOptions.uri += '/' + all.iterCtx.accountId + '/daily_reports'
    return all;
};

function addId2URL(all) {
    // all.iterCtx object is where you can keep data private for an iteration
    // all.requestOptions will be used for the request, modify as needed
    if (all.iterCtx.patId == null) all.iterCtx.patId = patients[ctr++];
    if (ctr == patients.length) ctr = 0;
    all.requestOptions.uri  += '/' + all.iterCtx.patId;
    return all; // always return all if you want it to continue
};

function addDocId2URL(all) {
    all.requestOptions.uri  += '/' + doc_id;
    return all; // always return all if you want it to continue
};




var flow = [];
flow[0]  = {
    before: [
        {post: url+'/login', json: {'username' : usr, 'password':pwd, grant_type : 'password'}, afterHooks: [saveToken]},
        {post: url+'/accounts', json: data.doctorsAccount, beforeHooks: [addAuthHeader], afterHooks: [saveDocID]}
    ],
    main: [  // the main flow for each iteration, #{INDEX} is unique iteration counter token
        { post: url+'/accounts', beforeHooks: [addAuthHeader], json : data.patientsAccount,  afterHooks: [savePatientID]  },
        { post: url+'/patients', beforeHooks: [injectPatientIdIntoData,addAuthHeader] }
    ]
};


flow[1] = {
    beforeMain: [
        { post: url + '/login', afterHooks: [saveToken],
            json: {'username': data.patientsAccount.username, 'password': data.patientsAccount.password, grant_type: 'password'}
            }
    ],
    main: [
        { post: url+'/patients', beforeHooks: [injectDailyReportData,addAuthHeader]}

    ]
};

flow[2] = {
    main: [  // the main flow for each iteration, #{INDEX} is unique iteration counter token
        { del: url+'/patients',  beforeHooks: [addId2URL, addAuthHeader]  },
        { del: url+'/accounts',  beforeHooks: [addId2URL, addAuthHeader]  }
    ],
    after: [{ del: url+'/accounts',  beforeHooks: [addDocId2URL, addAuthHeader]  }]
};



async.eachSeries(flow, function (singleFlow, cb){
        var timestamp = new Date().toUTCString();
        console.log('start: ' + timestamp);
        benchrest(singleFlow, runOptions)
            .on('error', function (err, ctxName) {
                console.error('Failed in %s with err: ', ctxName, err);
                console.log(err.stack);
                cb(err);
            })
            .on('progress', function (stats, percent, concurrent, ips) {
                console.log('Progress: %s complete', percent);
            })
            .on('end', function (stats, errorCount) {
                console.log('error count: ', errorCount);
                console.log('stats:', stats);
                cb();
            });
    },
    function (err) {
        var timestamp = new Date().toUTCString();
        console.log('end: ' + timestamp);
        console.log(' FLOWS COMPLETE ');
    }
);