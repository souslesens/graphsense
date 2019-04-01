var MainController = (function () {

    var self = {};

    self.init = function () {

        $("#navbar_graph").addClass("d-none");
        self.initSubGraph();

        Schema.load(context.subGraph,function(err,result){
            binder.bindOnPageload();
            Tree.init();
        });



    }


    self.initSubGraph = function () {
        var queryParams = common.getQueryParams(document.location.search);
        context.subGraph = queryParams.subGraph;
        if (!context.subGraphsubGraph)
            context.subGraphsubGraph = Config.defaultSubGraph;
    }

    self.alert=function(message){
        $(".alert").removeClass("d-none")
        $(".alert").html(message)

    }


    return self;
})()