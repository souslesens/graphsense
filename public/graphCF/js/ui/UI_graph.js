var UI_graph=(function(){
    var self={};


self.showSchema=function(subGraph){

    var visjsSchemaData=visJsDataProcessor.toutlesensSchemaToVisjs(Schema.schema);
    visjsGraph.draw("graphDiv",visjsSchemaData)

    }


    return self;

})()