var MainController = (function () {

    var self = {};

    self.init = function () {


      GraphController.initComponentsPositionAndSize("content")

        $("#navbar_graph").addClass("d-none");
        self.initSubGraph();
       // $('#sidebar').toggleClass('active');
        Schema.load(context.subGraph,function(err,result){
            binder.bindOnPageload();
            self.iniTrees()

        });



    }


    self.initSubGraph = function () {
        var queryParams = common.getQueryParams(document.location.search);
        context.subGraph = queryParams.subGraph;
        if (!context.subGraphsubGraph)
            context.subGraphsubGraph = Config.defaultSubGraph;
    }

    self.iniTrees=function(){


            var treekeys = Object.keys(Config.trees)
            common.fillSelectOptionsWithStringArray("tree_labelSelect", treekeys, true);

      /*  Config.simpleSearchTree=new Tree("search_treeContainerDiv");
        Config.hierarchyTree=new Tree("hierarchy_treeContainerDiv");*/





    }

    self.alert=function(message){
        MainController.openDialog(message);

    }
    self.alertClose=function(message){
        $("#genericMessageModal").modal('hide');


    }

    self.openDialog=function(content,validateFn){

        $("#genericMessageDiv").html(content);
        $("#genericMessageModal").modal('show');
        if(validateFn) {
            $("#genericMessageModalOkButton").removeClass("d-none")
            $("#genericMessageModalOkButton").bind("click", function () {
                validateFn();
            })
        }else {
            $("#genericMessageModalOkButton").addClass("d-none")
        }

    }






    return self;
})()