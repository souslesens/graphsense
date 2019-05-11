var Cypher=(function(){
    var self={};
    self.neo4jProxyUrl = "../../../neo";

    self.executeCypher = function (cypher, callback) {
        console.log(cypher);
        MainController.showSpinner(true);
        var payload = {match: cypher};
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                MainController.showSpinner(false);
             //   savedQueries.addToCurrentSearchRun(cypher,callback || null);
                callback(null, data)
            }, error: function (err) {
                MainController.showSpinner(false);
                callback(err)

            }
        })
    }

    return  self;



})()