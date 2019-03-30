var MainController = (function () {

    var self = {};

    self.init = function () {

        $("#navbar_graph").addClass("d-none");
        self.initSubGraph();
        Schema.load(context.subGraph,function(err,result){
            binder.bindOnPageload();
        });


    }


    self.initSubGraph = function () {
        var queryParams = common.getQueryParams(document.location.search);
        context.subGraph = queryParams.subGraph;
        if (!context.subGraphsubGraph)
            context.subGraphsubGraph = Gparams.defaultSubGraph;
    }


    return self;
})()