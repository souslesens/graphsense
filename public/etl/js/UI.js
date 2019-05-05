var UI=(function(){
    var self={};

    /*self.loadSubGraphSelects=function(){

        var requests=Requests.listStoredRequests();
        var nodeRequests=[];
        var relationRequests=[];

        requests.forEach(function(request){



        })

    }*/


    self.setDatasets=function(datasets) {

        common.fillSelectOptions("mainMenu_datasetSelect",datasets,"name",null,true);
        common.fillSelectOptions("nodeMapping_DatasetSelect",datasets,"name",null,true);
        common.fillSelectOptions("relationMapping_DatasetSelect",datasets,"name",null,true);


    }

    self.setMappingFieldsFromHeader=function(header){
        header.sort();
        header.splice(0,0,"");
        common.fillSelectOptionsWithStringArray("nodeMapping_ColPropertiesSelect",header);
        common.fillSelectOptionsWithStringArray("nodeMapping_ColIdSelect",header);
        common.fillSelectOptionsWithStringArray("nodeMapping_ColNameSelect",header);


        common.fillSelectOptionsWithStringArray("relationMapping_ColPropertiesSelect",header);
        common.fillSelectOptionsWithStringArray("relationMapping_ColIdSelect",header);
        common.fillSelectOptionsWithStringArray("relationMapping_ColNameSelect",header);





    }





    return self;

})()