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
    var treedivId = "treeDiv";


    self.init = function () {
        var treekeys = Object.keys(Config.trees)
        common.fillSelectOptionsWithStringArray("tree_labelSelect", treekeys, true);
    }

    self.setTree = function (treeJson, onSelectFn, expandAll) {
        $("#tree_addToselectionButton").addClass("d-none");
        $("#treeContainerDiv").load("htmlSnippets/tree.html", function () {


            // $('#' + treedivId+" ul").html("");
            //   $('#' + treedivId).parent().height(500);

            self.tree = $('#' + treedivId).tree(
                {
                    uiLibrary: 'bootstrap4',
                    dataSource: treeJson,
                    primaryKey: 'id',
                    //   imageUrlField: 'flagUrl',
                    checkboxes: true
                }
            );
            self.tree.on('select', function (e, node, id) {
                $("#tree_addToselectionButton").removeClass("d-none");
                if (onSelectFn)
                    onSelectFn(id);
            })

            if (expandAll)
                self.tree.expandAll();


        })

    }


    self.drawNodeHierarchyTree = function (key) {


        var treeParams = Config.trees[key];
        if (!treeParams)
            return;


        self.getJsTreeFromRoot(treeParams.label, treeParams.relType, function (err, children) {
            if (err)
                return console.log(err);

            var onSelectFn = function (id) {
                self.getNodes(treeParams.label, treeParams.relType, id, function (err, result) {

                    var parent = self.tree.getNodeById("" + id);
                    var children = result;
                    children.forEach(function (child) {
                        self.tree.addNode(child, parent);
                    })
                })
            }
            self.setTree(children, onSelectFn);
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

    self.addSelectionToQuery = function () {

        var checkedIds = self.tree.getCheckedNodes();


        context.queryObject = {};
        var clauseText = " hierarchy (" + checkedIds.length + " nodes)";
        context.queryObject.label = self.currentType;
        context.queryObject.text = clauseText;
        context.queryObject.type = "nodeSet-plugin-" + self.currentType;
        context.queryObject.where = buildPaths.getWhereClauseFromArray("_id", checkedIds, "n");
        context.queryObject.nodeSetIds = checkedIds;
        context.queryObject.inResult = true;
        UI_query.addCardToQueryDeck(context.queryObject);
        UI_query.showQueryMenu()


    }


    self.searchNodes = function (value) {
        if (value.length < 2)
            return;

        var cypher = "match(n) where n.name=~'(?i).*" + value + ".*' return labels(n)[0] as label , collect(id(n)) as ids, collect(n." + Config.defaultNodeNameProperty + ") as names limit " + Config.maxListDisplayLimit;
        Cypher.executeCypher(cypher, function (err, result) {
            if (err)
                return console.log(err);


            var treeData = []
            result.forEach(function (line, indexLine) {
                var children = [];
                line.ids.forEach(function (id, indexValue) {
                    children.push({
                        id: id,
                        text: result[indexLine].names[indexValue]
                    })
                })
                var text = "<span style='margin :2px; border-radius: 5px;background-color: " + context.nodeColors[line.label] + "'>" + line.label+" ("+line.ids.length+")" + "</span>"
                var node = {
                    id: -indexLine * 10000000,
                    text: text,
                    children: children,
                }
                treeData.push(node)


            })
            self.tree = "";
            self.setTree(treeData, null);
        })


    }


    return self;


})()