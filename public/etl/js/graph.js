var graph = (function () {
    var self = {};


    self.loadSubGraphs = function (subGraphSelect) {
        var match = "Match (n)  return distinct n.subGraph as subGraph order by subGraph";
        Cypher.executeCypher(match, function (err, data) {
            if (data && data.length > 0) {// } && results[0].data.length >
                var subgraphs = []
                for (var i = 0; i < data.length; i++) {
                    var value = data[i].subGraph;
                    subgraphs.push(value);
                }

                subgraphs.splice(0, 0, "");

                common.fillSelectOptionsWithStringArray(subGraphSelect, subgraphs);
            }
        })


    }

    self.initSubGraph = function (subGraph) {


        Schema.load(subGraph,function(err,result){
            if(err)
                return $("#messageDiv").html(err);
            context.subGraph = result;


        })


    }


    self.drawVisjsGraph = function () {


    }

    self.addSubGraph = function (subGraphSelect) {
        var newSubGraph = prompt("New Subgraph name ");
        if (!newSubGraph || newSubGraph.length == 0)
            return;

        $(subGraphSelect).append($('<option>', {
            text: newSubGraph,
            value: newSubGraph
        }));

        $(subGraphSelect).val(newSubGraph);
        requests.init(newSubGraph);
    }

    self.deleteNeoSubGraph = function (subGraph) {
        if (!subGraph)
            subGraph = $("#subGraphSelect").val();
        var ok = confirm("Voulez vous vraiment effacer le subGraph " + subGraph);
        if (!ok)
            return;

        var whereSubGraph = "";
        if (subGraph != Gparams.defaultSubGraph)
            whereSubGraph = " where n.subGraph='" + subGraph + "'"
        var match = 'MATCH (n)-[r]-(m) ' + whereSubGraph + ' delete  r';
        Cypher.executeCypher(match, function (err, data) {
            if (err)
                return $("#messageDiv").html(err);
            var match = 'MATCH (n)' + whereSubGraph + ' delete n';
            Cypher.executeCypher(match, function (err, data) {
                if (err)
                    return $("#messageDiv").html(err);
                $("#messageDiv").html("subGraph=" + subGraph + "deleted");
                $("#messageDiv").css("color", "red");
                $(graphDiv).html("");
                $('#labelsSelect')
                    .find('option')
                    .remove()
                    .end()

            });
            Schema.delete(subGraph);
        });
    }
    self.deleteLabel = function () {
        var label = $('#labelsSelect').val();
        var subGraph = $("#subGraphSelect").val();
        if (!label || label.length == 0) {
            $("#messageDiv").html("select a label first", "red");
            $("#messageDiv").css("color", "red");
            return;
        }

        if (confirm("delete all nodes and relations  with selected label?")) {
            var whereSubGraph = "";
            var subGraphName = $("#subGraphSelect").val()
            if (subGraphName != "")
                whereSubGraph = " where n.subGraph='" + subGraphName + "'"
            var match = "Match (n) " + whereSubGraph
                + " return distinct labels(n)[0] as label";
            var match = "Match (n:" + label + ") " + whereSubGraph + " DETACH delete n";
            Cypher.executeCypher(match, function (err, data) {
                if (err)
                    return $("#messageDiv").html(err);
                $("#messageDiv").html("nodes with label=" + label + "deleted");
                $("#messageDiv").css("color", "green");
                admin.drawVisjsGraph();

            });
        }


    }

    return self;


})()