var context = (function () {

    var self = {};
    self.subGraph = "";
    self.nodeColors = {};
    self.edgeColors = {};


    self.graphContext = {};
    self.queryObject = {};
    self.currentNode = {};
    self.cypherMatchOptions = {}
    self.currentRelations = {types: [], props: []}
    self.mousePosition={x:0,y:0}




    return self;


})();