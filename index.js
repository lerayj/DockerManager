var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    Docker = require('dockerode'),
    moment = require('moment');

var docker = new Docker();
mongoose.connect('mongodb://admin:oooP.6th@ds113650.mlab.com:13650/healthbook');

const HAR_GENERATING_TIME = 3000;

function launchReport(url){
    var urlToReport = cleanUrl = url;

    if (urlToReport.substr(0, 7) == "http://")
        cleanUrl = urlToReport.substr(7);

    var saveDir = "browsertime-results/" + cleanUrl + moment().toISOString();

    var snippet = "return new Date().valueOf() > window.performance.timing.loadEventEnd + " + HAR_GENERATING_TIME;
    console.log("cleanUrl: ",cleanUrl, " urlToReport: ", urlToReport);
    var prom = new Promise(function(resolve, reject){
        docker.run('sitespeedio/browsertime', [urlToReport, '-n', '1', '--resultDir', saveDir, '--pageCompleteCheck', snippet], process.stdout, {
            Volumes: {[__dirname]: {}},
            HostConfig: {
                Binds: [__dirname + "/browsertime-results:/browsertime-results"],
                ShmSize: 1000000000,
                Privileged: true,
                AutoRemove: true
            }
        }, {},
        function (err, data, container) {
            if(err){
                console.log("Error: ", err);
                reject("Error on generation report");
            }
            else{
                resolve({data, path: saveDir});
            }
        });
    });
    console.log("Blocking?");
    return prom;
}


app.post('/', function (req, res) {
    var url = req.query.url;
    console.log("query url: ", url);
    res.send("OK");
    launchReport(url).then(function(result){
        console.log("End Process: ", result);

        
    });
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Example app listening on port ', port);
});


//docker run --privileged --shm-size=1g --rm 
//-v "$(pwd)":/browsertime-results sitespeedio/browsertime -n 1 -c cable 
//--video --speedIndex 
//--pageCompleteCheck 'return new Date().valueOf() > window.performance.timing.loadEventEnd + 30000' 
//https://www.sitespeed.io/
