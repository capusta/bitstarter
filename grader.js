#!/usr/bin/env node
var fs = require('fs');
var program=require('commander');
var cheerio=require('cheerio');
var rest=require('restler');
var HTMLFILE_DEFAULT="index.html";
var CHECKFILE_DEFAULT="checks.json";

var assertFileExists=function(infile) {
    var instr=infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist.  Exiting.",instr);
	process.exit(1);
    }
    return instr;
};
var assertURL=function(inURL){
    return inURL.toString();
};
var cheerioHtmlFile=function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};
var loadChecks=function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};
var checkHtmlFile=function(htmlfile,checksfile) {
    $=cheerioHtmlFile(htmlfile);
    var checks=loadChecks(checksfile).sort();
    var out={};
    for (var ii in checks) {
	var present=$(checks[ii]).length>0;
	out[checks[ii]]=present;
    }
    return out;
};

var clone=function(fn) {
    return fn.bind({});
};

if(require.main==module){
    program
	.option('-c, --checks <check_file>', 'Path to checkfile', clone(assertFileExists), CHECKFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'Path to the URL', clone(assertURL))
	.parse(process.argv);
    if (program.url){
        rest.get(program.url.toString()).on('complete', function(data){
            fs.writeFileSync("urlFile.html", data);
            //console.log(data);
        });
        var checkJson=checkHtmlFile("urlFile.html", program.checks);
        //console.log("doing URL");
    }
    else {
        var checkJson=checkHtmlFile(program.file, program.checks);
    }
    var outJson=JSON.stringify(checkJson, null, 4);
    console.log(outJson);
} else {
    exports.checksHtmlFile=checkHtmlFile;
}
