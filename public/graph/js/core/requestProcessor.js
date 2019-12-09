var RequestProcessor = (function () {
    var self = {};

    self.showGraph = function (type, options) {
        var cypher = null;
        var neoData = null;
        var visjsData = null;

        async.series([
            // buildQuery
            function (callbackSeries) {
                cypher = buildPaths.buildQuery(type, options);

                return callbackSeries();
            },

            // executeQuery
            function (callbackSeries) {
                Cypher.executeCypher(cypher, function (err, result) {
                    if (err)
                        callbackSeries(err);
                    if(result.length==0) {
                        return callbackSeries("no result for this query");
                    }
                    neoData = buildPaths.prepareDataset(result);
                    return callbackSeries();
                })
            },



            // prepare results
            function (callbackSeries) {
                visjsData = visJsDataProcessor.transformNeo2Visj(neoData)
                return callbackSeries();
            },

            // draw graph
            function (callbackSeries) {
                visjsGraph.draw("graphDiv", visjsData, {}, function (err, result) {
                    return callbackSeries();
                })

            },


            // draw legend
            function (callbackSeries) {
                visjsGraph.drawLegend(visjsData);
                return callbackSeries();
            },

            // show graphTools and hide modal
            function (callbackSeries) {
                $('#GraphComplexQueryMenu').modal('hide');
                $("#navbar_graph_Graph_ul").removeClass("d-none");
                $("#simpleQuery_erase").removeClass("d-none");
                return callbackSeries();
            },




        ], function (err) {
            if (err)
                alert(err);
            return "DONE"


        })


    }

    return self;
})()
