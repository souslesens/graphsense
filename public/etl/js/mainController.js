var MainController = (function () {
    var self = {};
    self.jsonDBStoragePath = "../../../jsonDBStorage";


    self.init0 = function () {

        graph.loadSubGraphs(mainMenu_subGraphSelect);
        self.loadDatasetNames();

        self.initSocket();


    }


    self.callServer = function (path, payload, callback) {
        $.ajax({
            type: "POST",
            url: path,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                callback(null, data)
            }, error: function (err) {
                callback(err)
            }
        })
    }


    self.initSocket = function () {
        var url = window.location.href;
        var p = url.indexOf('/elt');
        url = url.substring(0, p);
        var socket = io.connect(url);
        socket.on('connect', function (data) {
            socket.emit('join', 'Hello World from client');
        });
        socket.on('messages', function (message) {


            $("#waitImg").css("visibility", "hidden");
            if (typeof message == 'string') {
                if (message.indexOf("listCsvFields") > 0) {
                    var messageObj = JSON.parse(message);
                    ui.initImportDialogSelects(messageObj);

                    var subGraph = $("#subGraphSelect").val();
                    messageObj.subGraph = subGraph
                    requests.saveCSVsource(messageObj);
                    requests.init(subGraph);
                    return;
                }
                var color = "green";


                if (message.indexOf("ENOENT") > -1)
                    return;

                if (message.toLowerCase().indexOf("error") > -1)
                    color = "red";
                $("#messageDiv").css("color", color);
                $("#messageDiv").html(message);

            }
            else {

                if (message.status && message.status == "loaded") {
                    $("#messageDiv").css("color", "green");
                    $("#messageDiv").html(message.message);
                    context.currentDataSource = message;
                    $("#datasetModal").modal("hide");

                    context.datasets.push(message)
                    UI.setDatasets(context.datasets);
                    UI.setMappingFieldsFromHeader(message.header);
                }


            }
        })
    }

    self.loadDatasetNames = function () {
        var payload = {
            jsonDBStorage: true,
            getDatasetNames: true
        }
        self.callServer(self.jsonDBStoragePath,payload,function(err, result){
           context.datasets=result;
           var datasets=[];
           result.forEach(function(line){
               datasets.push({name:line})
           })
           UI.setDatasets(datasets);

        })


    }


    return self;

})()