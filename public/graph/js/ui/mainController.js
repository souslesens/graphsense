var MainController = (function () {

    var self = {};

    self.init = function () {


        GraphController.initComponentsPositionAndSize("content")

        $("#navbar_graph").addClass("d-none");

        self.loadSubGraphs();
        self.initSubGraph();

        // $('#sidebar').toggleClass('active');



    }


    self.initSubGraph = function (subGraph) {
        if(!subGraph) {
            var queryParams = common.getQueryParams(document.location.search);
            context.subGraph = queryParams.subGraph;
        }
        else
            context.subGraph = subGraph;

        Schema.load(context.subGraph, function (err, result) {
            binder.bindOnPageload();
            self.iniTrees();
            UI_graph.showSchema(context.subGraph)

        });


    }

    self.iniTrees = function () {


        var treekeys = Object.keys(Config.trees)
        common.fillSelectOptionsWithStringArray("tree_labelSelect", treekeys, true);

        /*  Config.simpleSearchTree=new Tree("search_treeContainerDiv");
          Config.hierarchyTree=new Tree("hierarchy_treeContainerDiv");*/


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


    return self;
})()