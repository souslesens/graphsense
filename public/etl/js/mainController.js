var MainController = (function () {
    var self = {};
    self.jsonDBStoragePath = "../../../jsonDBStorage";


    self.init0 = function () {

        graph.loadSubGraphs(mainMenu_subGraphSelect);
        datasets.loadDatasetCollectionNames();
        self.initSocket();


    }


    self.checkUploadDatasetForm=function(){

        var datasetName=$("#upload_datasetCollectionName").val();
        if(!datasetName || datasetName=="") {
            alert("Dataset  Name is mandatory")
            return false;
        }
        document.forms['uploadXlsxForm'].submit()
        return true;
    }
    self.showSpinner = function (state) {
        if (state === false)
            $("#waitSpinnerDiv").addClass("d-none")
        else
            $("#waitSpinnerDiv").removeClass("d-none")
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
              /*  if (message.indexOf("listCsvFields") > 0) {
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
                $("#messageDiv").html(message);*/

            }
            else {

                if (message.status && message.status == "loaded") {
                    $("#messageDiv").css("color", "green");
                    $("#messageDiv").html(message.message);
                    context.currentDataSource = message;
                    $("#datasetModal").modal("hide");
                    self.loadDatasetCollectionNames(function(){
                        datasets.setCurrentDataset(message.name);

                    })


                }


            }
        })
    }




    return self;

})()