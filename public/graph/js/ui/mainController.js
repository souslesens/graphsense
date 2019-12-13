var MainController = (function () {

    var self = {};
    self.jsonDBStoragePath = "../../../jsonDBStorage";




    self.init = function () {

        self.loadPlugins();
        //$("#sidebar").addClass("d-none")

        GraphController.initComponentsPositionAndSize("content")

        $("#navbar_graph").addClass("d-none");

        self.loadSubGraphs();



        // $('#sidebar').toggleClass('active');


    }
self.loadPlugins=function(){

        var queryParams = common.getQueryParams(document.location.search);
        Config.plugins={};
        if (queryParams.plugin ) {
            Config.plugins[queryParams.plugin]=true

        }
    }

    self.initSubGraph = function (subGraph) {


        if (!subGraph)
            subGraph = context.subGraph;
        var user;
        if (context.user)
            user = context.user;
        context = new Context();
        context.user=user;
        context.subGraph = subGraph;
        //reinitilialisation context;
        Schema.load(subGraph, function (err, result) {
            binder.bindOnPageload();
            //A vérifier Claude
            //Réinitialisatio de la requete quand on change de subgraph

            UI_query.initQueryLabels();
            UI_query.newQuery();
            Tree.iniTrees();



            if (Config.plugins.paragraphEntitiesGraph)
                MainController.openAccordion("searchSubMenu");

            // fin reinitialisation
            UI_graph.showSchema(context.subGraph);
            Cache.cacheGraphSchema();


        });


    }

    self.loadSubGraphs = function () {
        var match = "Match (n)  return distinct n.subGraph as subGraph order by subGraph";
        Cypher.executeCypher(match, function (err, data) {
            if (data && data.length > 0) {// } && results[0].data.length >
                var subgraphs = []
                for (var i = 0; i < data.length; i++) {
                    var value = data[i].subGraph;
                    subgraphs.push(value);
                }

                subgraphs.splice(0, 0, "");

                common.fillSelectOptionsWithStringArray(mainMenu_subGraphSelect, subgraphs);


                var queryParams = common.getQueryParams(document.location.search);
                if (queryParams.subGraph) {
                    context.subGraph = queryParams.subGraph;
                    $("#mainMenu_subGraphSelect").val(queryParams.subGraph);
                }
                else {
                    context.subGraph = subgraphs[1];
                    mainMenu_subGraphSelect.selectedIndex = 1;
                }
                MainController.initSubGraph(context.subGraph);
            }
        })


    }

    self.alert = function (message) {
        MainController.openDialog(message);

    }
    self.alertClose = function () {
        $("#genericMessageModal").modal('hide');


    }

    self.openDialog = function (content, validateFn) {

        $("#genericMessageDiv").html(content);
        $("#genericMessageModal").modal('show');
        if (validateFn) {
            $("#genericMessageModalOkButton").removeClass("d-none")
            $("#genericMessageModalOkButton").bind("click", function () {
                validateFn();
            })
        } else {
            $("#genericMessageModalOkButton").addClass("d-none")
        }

    }
    self.closeDialog = function () {
        self.alertClose();


    }

    self.showSpinner = function (state) {
        if (state === false)
            $("#waitSpinnerDiv").addClass("d-none")
        else
            $("#waitSpinnerDiv").removeClass("d-none")
    }

    self.openAccordion=function(divId){
     $(".accordion").each(function(){
         if($(this).attr("id")!=divId)
             $(this).collapse('hide')
     })
        $("#"+divId).collapse('show')

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


    return self;
})()
