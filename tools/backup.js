var exec = require('child_process').exec;
var fs = require('fs');
var http = require('http');
var config = require('../config.js');

var user = process.argv[2];
var pw = process.argv[3];
var filename = process.argv[4]
if (fs.existsSync('db.dump'))
    fs.unlinkSync('db.dump');
var cmd = 'mysqldump --no-create-info --skip-triggers -u' + user + ' -p' + pw + ' echo > ' + filename;
exec(cmd, function(err, stdout, stderr) {
    if (err || stderr) {
        fatal = true;
        if (stderr.indexOf('insecure') > -1 && !err) fatal = false;
        if (fatal){
            process.exit(1);
            console.log('ERROR: ' + (err || stderr));
        }
    }
    var postOptions = {
        path: url,
        host: config.notificationService.host,
        port: '80',
        method: 'POST',
        headers: {
            Authorization: config.notificationService.apiKey
        }
    };
    if (postOptions.host) {
        process.exit(1);
    }
    var url = '/echo/email';
    var dump = fs.readFileSync(filename, {encoding: 'utf8'});
    var mail = config.dumpMail;
    var data = JSON.stringify({
        'subject': 'Daily Mail Dump',
        'message': dump,
        'to': mail,
        'label': 'ECHO'
    });
    var request = http.request(postOptions, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            console.log(data)
        });
    });
    request.write(data);
    request.end();
});
