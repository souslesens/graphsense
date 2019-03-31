var MainController = (function () {

    var self = {};

    self.init = function () {

        $("#navbar_graph").addClass("d-none");
        self.initSubGraph();
        Schema.load(context.subGraph,function(err,result){
            binder.bindOnPageload();
        });

        Tree. drawTree("myTree1Test","physicalClass","childOf");


    }


    self.initSubGraph = function () {
        var queryParams = common.getQueryParams(document.location.search);
        context.subGraph = queryParams.subGraph;
        if (!context.subGraphsubGraph)
            context.subGraphsubGraph = Config.defaultSubGraph;
    }


    return self;
})()