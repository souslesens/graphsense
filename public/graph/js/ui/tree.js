Tree = (function () {
    var self = {};
self.tree;
    self.selection = [];
    self.selectionName = "";
    self.currentNode;
    self.initiated = false;
    self.loadedNodes = [];
    self.currentRootNeoId;
    self.currentType;


    self.drawTree = function (treedivId, label, relType) {

        self.getJsTreeFromRoot(label, relType, function (err, children) {
            if (err)
                return console.log(err);
           self.tree = $('#' + treedivId).tree(
                {
                    uiLibrary: 'bootstrap4',
                    dataSource: children,
                    primaryKey: 'id',
                    //   imageUrlField: 'flagUrl',
                    checkboxes: true
                }
            );
            self.tree.on('select', function (e, node, id) {

                self.getNodes(label, relType, id, function (err, result) {

                    var parent = self.tree.getNodeById("" + id);
                    var children = result;
                    children.forEach(function (child) {
                        self.tree.addNode(child, parent);
                    })
                })

            });
        });


    }


    self.getNodes = function (type, relType, rootNeoId, callback) {


        var payload = {
            generateTreeFromParentToChildrenRelType: 1,
            label: type,
            relType: relType,
            rootNeoId: rootNeoId
        }


        $.ajax({
            type: "POST",
            url: Cypher.neo4jProxyUrl,
            dataType: "json",
            data: payload,
            success: function (parentNode, textStatus, jqXHR) {

                return callback(null, parentNode.children)

            },
            error: function (error) {
                return callback(error)
            }
        })
    }


    self.getJsTreeFromRoot = function (label, relType, callback) {
        self.currentType = label;
        self.currentRootNeoId = relType;
        self.loadedNodes = [];

        var match = "Match (n:" + label + ") where n.name='Root' return id(n) as id";
        var payload = {
            match: match,
        }


        var cypher = "Match (n:" + label + ") where n.name='Root' return id(n) as id";
        Cypher.executeCypher(cypher, function (err, result) {
            if (err)
                return console.log(err);
            self.currentRootNeoId = result[0].id;
            self.getNodes(label, relType, self.currentRootNeoId, callback)

        })

    }

    self.addSelectionToQuery=function(){

        var ids=self.tree.getCheckedNodes();
        context.queryObject = {};
        var clauseText = " hierarchy ("+ids.length+" nodes)";
        context.queryObject.label = self.currentType;
        context.queryObject.text = clauseText;
        context.queryObject.type = "nodeSet-plugin-" + self.currentType;
        context.queryObject.where = buildPaths.getWhereClauseFromArray("_id", ids, "n");
        context.queryObject.nodeSetIds = ids;
        context.queryObject.inResult = true;
        UI_query.addCardToQueryDeck (context.queryObject);



    }


    return self;


})()