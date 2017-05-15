var fs = require('fs');
var imageinfo = require('imageinfo');
var mustache = require('mustache');
var execSync = require('child_process').execSync;
var templateFile = "./template/vgg-conv.cfg.template";
var template = fs.readFileSync(templateFile, 'utf-8');

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " path/to/directory");
    process.exit(-1);
}

var path = process.argv[2];

function searchDir(path) {
    var items = fs.readdirSync(path);
    var results = [];
    for (var i=0; i<items.length; i++) {
        var pathname = path + '/' + items[i];
        if(fs.existsSync(pathname)) {
            var data = fs.readFileSync(pathname);
            var info = imageinfo(data);
            var fileType = info.mimeType;
            if(fileType == "image/png" || fileType == "image/jpg") {
                console.log(pathname +  "  Dimensions:", info.width, "x", info.height);
                results.push({file: pathname, width: info.width, height: info.height});
            } else {
                console.log(pathname + " - skipped");
            }
        }
    }
    return results;
}

var results = searchDir(path);
results.forEach(function(item) {
    var view = {};
    if(item.width > 1200 || item.height > 1200) {
        var ratio = item.width / item.height;
        if(item.width > item.height) {
            view = {
                width: 1200,
                height: Math.round(1200 / ratio)
            }
        } else {
            view = {
                width: Math.round(ratio * 1200 ),
                height: 1200
            }
        }
    } else {
        view = {
            width: item.width,
            height: item.height
        }
    }

    var filename = item.file;
    var output = mustache.render(template,view);
    fs.writeFileSync('./tmp/vgg-conv.cfg', output);
    var cmd = "./darknet nightmare tmp/vgg-conv.cfg vgg-conv.weights \"" + filename + "\" 15 && mv *png results";
    console.log("exec " + cmd);
    execSync(cmd);
    fs.unlinkSync('./tmp/vgg-conv.cfg');
}, this);
