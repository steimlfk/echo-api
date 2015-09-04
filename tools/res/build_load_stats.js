var fs = require('fs');
var lazy = require("lazy")
var async = require ('async');

var path = '/Users/steimlfk/git/echo-api/logs_2015-06-25-12-45-45/';
var files = fs.readdirSync(path);

function insert(str, index, value) {
    return str.substr(0, index) + value + str.substr(index);
}
var data = [];
var size = 0;

async.eachSeries(files, function(f, cb) {
    data [size] = [];
    async.series([
        function (ccb) {
            console.log('processing ' + f);
            var inStats = false;
            var statsLines = '';

            fs.readFileSync(path +f).toString().split('\n').forEach(function (line) {
                var l = line.toString('utf8');
                if (l.indexOf('stats') > -1) inStats = true;
                if (l.indexOf('start') > -1) inStats = false;
                if (l.indexOf('end:') > -1) inStats = false;

                if (inStats) {
                    statsLines += l;
                }
                else if (statsLines.length > 1) {
                    var i = 0;
                    var j = statsLines.length;
                    var limiter = false;
                    while (i < j) {
                        var n = statsLines.charCodeAt(i);
                        if ((n > 64 && n < 91) || (n > 96 && n < 123) || (n == 39)) {
                            if (limiter) {
                                statsLines = insert(statsLines, i, '"');
                                j = statsLines.length;
                                i++;
                                limiter = false;
                            }
                        }
                        else switch (n) {
                            case (n = 58):
                            { //:
                                statsLines = insert(statsLines, i, '"');
                                j = statsLines.length;
                                i++
                            }
                                break;
                            case (n = 123):
                            case (n = 125):
                            case (n = 44):
                            {
                                limiter = true;
                            }
                                break;
                        }
                        i++;
                    }
                    data[size].push(JSON.parse('{"' + statsLines + '}'))
                    statsLines = '';
                }
            });

            ccb();
        }
    ], function (bla){
        size++;
        cb();
    });

}, function(err){
    var itCount = 4;
    var cpuCount = 3;

    function iterateOverData(o, depth){
        var s = (depth)? depth : '';
        for(var a in o){
            if (typeof o[a] == 'object'){
                s+=iterateOverData(o[a], s);
            }else{
                s += a + '\n';
            }
        }
        return s;
    }

    var excelData = iterateOverData(data[0][0].stats, null);
    console.log(excelData);

    /*
     var i = 0;
     var captions = ['1 Core', '2 Cores', '4 Cores'];
     var headings = a + '\t10 Iterations \t100 Iterations \t1000 Iterations \t10000 Iterations \n';
     s += headings;
     while (i < cpuCount){
     s += captions[i] + '\t';
     var j = itCount-1;
     while(j >= 0) {
     s += data[j+i][0].stats['main','meter', a] + '\t';
     j--;
     }
     s += '\n';
     i++;
     }
     */
});



