var multer = require('multer');
var neoProxy = require("../bin/neoProxy")
const csv = require('csv-parser');
var socket = require('../routes/socket.js');

const xlsxToNeo = require("../bin/transform/xlsxToNeo..js")
var util = require("./util.js")
var jsonDBStorage = require("../bin/jsonDBStorage..js")


var fileToNeoLoader = {

    processForm: function (req, callbackOuter) {
        var xlsxBuffer;
        var mappingsStr;
        var storage = multer.memoryStorage();
        var uploadMaxSize = 100 * 1000 * 1000; //100M;
        var upload = multer({
            storage: storage,
            limits: {fileSize: uploadMaxSize}
        }).any();
        upload(req, null, function (err, data) {
            if (err) {
                if (callback)
                    callback('Error Occured' + err);
                return;
            }
            req.files.forEach(function (file) {
                if (file.fieldname == "file") {

                    var extension = file.originalname.substring(file.originalname.lastIndexOf(".") + 1).toLowerCase().toLowerCase();

                    if (extension == "xlsx") {
                        fileToNeoLoader.xlsxToNeo(file, function (err, result) {
                            return callbackOuter(err, result);
                        })

                    } else if (extension == "csv") {

                        fileToNeoLoader.csvToNeo(file, function (err, result) {
                            return callbackOuter(err, result);
                        })
                    }


                }
                else {
                    return callbackOuter("wrong file input name")
                }


            })


        })
    },


    csvToNeo: function (file, callback) {
        var dataArray = [];
        var headers = [];
        var fileName = file.originalname.substring(0, file.originalname.lastIndexOf("."))
        var separator = util.getCsvStringSeparator("" + file.buffer);
        if (!separator)
            return callback("no correct column or line separator in file")
        var count = 0;

        var countLines = 0



        var Readable = require('stream').Readable

        var streamBuffer = new Readable
        streamBuffer.push(file.buffer)    // the string you want
        streamBuffer.push(null)

// With a buffer
        streamBuffer.pipe(csv(
                {
                    separator: separator,
                    mapHeaders: ({header, index}) =>
                        util.normalizeHeader(headers, header)
                    ,


                })
                .on('header', (header) => {
                    headers.push(header);
                })

                .on('data', function (data) {

                    dataArray.push(data)

                })
                .on('end', function () {
                    console.log(countLines)
                    var xx = dataArray;
                    var yy = headers;


                    jsonDBStorage.writeDataset({name:fileName,header: headers, data: dataArray})
                    //  fs.writeFileSync(filePath, JSON.stringify({headers: headers, data: results}, null, 2));
                    var result = {
                        message: "file " + fileName + " loaded",
                        name: fileName,
                        header: headers,
                        type:"csvFile",
                        status :"loaded"

                    };
                 socket.message(result);
                    callback(null, result);
                }))
        /*  .on('headers', (headers) => {
              console.log(`First header: ${headers[0]}`)
          })*/


    },
    xlsxToNeo: function (req, callback) {

    }


}

module.exports = fileToNeoLoader;