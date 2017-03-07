var express = require('express'),
    app = express(),
    Docker = require('dockerode'),
    moment = require('moment');
var kue = require('kue'),
    queue = kue.createQueue({
        redis: 'redis://toto@redis-14773.c3.eu-west-1-2.ec2.cloud.redislabs.com:14773'
    });

var docker = new Docker();

const HAR_GENERATING_TIME = 3000,
    DOCKER_INSTANCES = 2;


queue.process('report', function(job, done){
    console.log("During processing")
  processReport(job.data.url, done);
});

function processReport(url, done){
    var urlToReport = cleanUrl = url;

    if (urlToReport.substr(0, 7) == "http://")
        cleanUrl = urlToReport.substr(7);
    var saveDir = "browsertime-results/" + cleanUrl + moment().toISOString();
    var snippet = "return new Date().valueOf() > window.performance.timing.loadEventEnd + " + HAR_GENERATING_TIME;

   return new Promise(function(resolve, reject){
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
    }).then((data, path) => {
        console.log("DONE");
        done();  
    }); 
}