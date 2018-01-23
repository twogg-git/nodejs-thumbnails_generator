var crypto = require('crypto');
var express = require('express'), app = module.exports = express();
var fs = require('fs');
var configuration = require("./config.json");
var webshot = require('webshot');
var im = require('imagemagick');

var winston = require('winston');
winston.add(winston.transports.File, {filename: 'logger.log'});

app.get('/thumb', function (req, res, next) {

    var urlPrm = req.query.url == undefined ? '' : req.query.url;
    var widthPrm = req.query.w == undefined ? '' : req.query.w;
    var heightPrm = req.query.h == undefined ? '' : req.query.h;

    winston.info("? W: " + widthPrm + ", H: " + heightPrm + ", URL: " + urlPrm );

    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function (str) {
            return this.indexOf(str) === 0;
        };
    }

    function isNumber(n) {
        return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
    }

    //validate if url parameter is empty
    if (urlPrm != '') {

        //validate if url parameter has a valid protocol
        if (urlPrm.startsWith("http://") || urlPrm.startsWith("https://")) {

            //create the thumb file name using md5 with the url
            var hashUrl = crypto.createHash('md5').update(urlPrm).digest('hex');

            //validates if resize is required
            if (widthPrm != '' && heightPrm != '') {
                if (isNumber(widthPrm) && isNumber(heightPrm)) {
                    var pathResize = configuration.server.thumbs_path + hashUrl + "_" + widthPrm + "x" + heightPrm + '.png';
                    fs.stat(pathResize, function (err, stat) {
                        if (err) {
                            // creates a thumb with the original size
                            var options = {
                                defaultWhiteBackground: true
                            };
                            webshot(urlPrm, pathResize, options, function (err) {
                                if(err){
                                    winston.error(err);
                                    return err;
                                }
                                // then resize the image and deleted the previous one
                                im.resize({
                                    srcPath: pathResize,
                                    dstPath: pathResize,
                                    width: widthPrm
                                }, function (err, stdout, stderr) {
                                    if(err){
                                        winston.error(err);
                                        return err;
                                    }
                                    var data = fs.readFileSync(pathResize, 'Base64');
                                    var buf = new Buffer(data, encoding = 'Base64');
                                    winston.info(">> URL: " + urlPrm + " Thumbnail: " + hashUrl + "_" + widthPrm + "x" + heightPrm + ".png");
                                    res.end(buf);

                                });
                            });
                        } else {
                            var data = fs.readFileSync(pathResize, 'Base64');
                            var buf = new Buffer(data, encoding = 'Base64');
                            winston.info("** Thumb already exist. URL: " + urlPrm + " Thumbnail: " + hashUrl + "_" + widthPrm + "x" + heightPrm + ".png");
                            res.end(buf);
                        }
                    });
                } else {
                    winston.error("ERROR - Invalid resize parameters W " + widthPrm + " H " + heightPrm);
                    res.end("ERROR - Invalid resize parameters W " + widthPrm + " H " + heightPrm);
                    res.status(400);
                }
                // create the thumb with the original size
            } else if (widthPrm == '' && heightPrm == '') {
                var pathOriginal = configuration.server.thumbs_path + hashUrl + '.png';
                fs.stat(pathOriginal, function (err, stat) {
                    if (err) {
                        var options = {
                            defaultWhiteBackground: true
                        }
                        webshot(urlPrm, pathOriginal, options, function (err) {
                            var data = fs.readFileSync(pathOriginal, 'Base64');
                            var buf = new Buffer(data, encoding = 'Base64');
                            winston.info(">> URL: " + urlPrm + ", Thumbnail: " + hashUrl + ".png");
                            res.end(buf);
                        });
                    } else {
                        var data = fs.readFileSync(pathOriginal, 'Base64');
                        var buf = new Buffer(data, encoding = 'Base64');
                        winston.info("** Thumb already exist. URL: " + urlPrm + " Thumbnail: " + hashUrl + ".png");
                        res.end(buf);
                    }
                });
            } else {
                winston.error("ERROR - Missing parameters W " + widthPrm + " H " + heightPrm);
                res.end("ERROR - Missing parameters W " + widthPrm + " H " + heightPrm);
                res.status(400);
            }
        } else {
            winston.error("ERROR - Missing protocol on URL - " + urlPrm);
            res.end("ERROR - Missing protocol on URL - " + urlPrm);
            res.status(400);
        }
    } else {
        winston.error("ERROR - Missing URL parameter");
        res.end("ERROR - Missing URL parameter");
        res.status(400);
    }
});

if (!module.parent) {
    app.listen(configuration.server.port);
    winston.log("Thumbnailer started on port %d", configuration.server.port);
}
