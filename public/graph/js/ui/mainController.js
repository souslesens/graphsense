var MainController = (function () {

    var self = {};

    self.init = function () {
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