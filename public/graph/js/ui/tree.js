Tree = (function () {
        var self = {};
        self.tree;
        self.currentType;
        self.searchIncrement=0;
        self.checkboxChangeTimeStamp=0;
        var treedivId = "treeDiv";


        self.init = function () {
            var treekeys = Object.keys(Config.trees)
            common.fillSelectOptionsWithStringArray("tree_labelSelect", treekeys, true);
        }

        self.setTree = function (treeJson, onSelectFn, expandAll) {
            $(".tree_addToselectionButton").addClass("d-none");

         if( self.tree) {
             self.tree.destroy()
             self.tree.disableAll()

         }

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

                if (onSelectFn)
                    onSelectFn(id);

            });

            self.tree.on('checkboxChange', function (e, $node, record, state) {
             //   if((e.timeStamp-self.checkboxChangeTimeStamp)>500)//avoid repetition intempestive
                Tree.addSelectionToQuery(state)
                self.checkboxChangeTimeStamp=e.timeStamp;
                /*   $("#treePopoverWrapperDiv").css("top", context.mousePosition.y).css("left", context.mousePosition.x);
                   $("#treePopoverWrapperDiv").removeClass("d-none")
                   $(".alert").addClass("d-none");*/

            })
            self.tree.reload()
            if (expandAll)
                self.tree.expandAll();


            // })

        }


        self.drawNodeHierarchyTree = function (key, _treedivId) {
            treedivId = _treedivId;
            self.currentType = key;
            var treeParams = Config.trees[key];
            if (!treeParams)
                return;


            self.getJsTreeFromRoot(treeParams.label, treeParams.relType, treeParams.rootSelector, function (err, children) {
                if (err)
                    return console.log(err);

                var onSelectFn = function (id) {

                    self.getNodes(treeParams.label, treeParams.relType, id, function (err, result) {

                        var parent = self.tree.getNodeById("" + id);
                        var children = result;
                        var level = self.tree.parents(id).length;
                        //   var colors=["#E0E0E0","#D8D8D8","#D0D0D0","#C8C8C8","#C0C0C0","#B8B8B8"]
                        children.forEach(function (child) {
                            //  child.text="<span style='background-color: "+colors[level]+"'>"+child.text+"</span>"
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


        self.getJsTreeFromRoot = function (label, relType, rootSelector, callback) {

            var relType = relType;
            $(".alert").addClass("d-none");

            var cypher = "Match (n:" + label + ") where n." + rootSelector + " and n.subGraph='" + context.subGraph + "'  return id(n) as id";
            Cypher.executeCypher(cypher, function (err, result) {
                if (err)
                    return console.log(err);
                var currentRootNeoId = result[0].id;
                self.getNodes(label, relType, currentRootNeoId, callback)

            })

        }

        self.addSelectionToQuery = function (state) {


            var checkedIds = self.tree.getCheckedNodes();
            if (checkedIds.length > Config.maxInIdsArrayLength)
                return MainController.alert("too many nodes selected : max " + Config.maxInIdsArrayLength);
            var ids=[];
            if(state=="checked") {
                checkedIds.forEach(function (id) {
                    if (id > -1)//parents label in search tree
                        ids.push(id)
                })
            }

            var queryObject = {};
            var clauseText = " set (" + ids.length + " nodes)";
            queryObject.label = null;
            queryObject.text = clauseText;
            queryObject.cardTitle = self.currentType;
            queryObject.type = "nodeSet" + self.currentType;
            queryObject.where = buildPaths.getWhereClauseFromArray("_id", ids, "n");
            queryObject.nodeSetIds = ids;
            queryObject.inResult = true;


            var cardId = $(".type_nodeSet" + self.currentType).attr("id");


            if (cardId) {//update
                var index = parseInt(cardId.substring(cardId.lastIndexOf("_") + 1))
                UI_query.updateCardToQueryDeck(queryObject, index, "only")

            }
            else {//new


                UI_query.addCardToQueryDeck(queryObject);


            }
            UI_query.showQueryMenu()


        }


        self.searchNodes = function (value, _treedivId) {

            treedivId = _treedivId;
            if (value.length < 2)
                return;
            var cypher
            if (value.indexOf("match") == 0)
                cypher = value;
            else {
                var whereSubGraph="";
                if(context.subGraph && context.subGraph!="")
                    whereSubGraph=" and n.subGraph='"+context.subGraph+"' "
                cypher = "match(n) where n.name=~'(?i).*" + value + ".*' "+whereSubGraph+" return labels(n)[0] as label , collect(id(n)) as ids, collect(n." + Config.defaultNodeNameProperty + ") as names limit " + Config.maxListDisplayLimit;

            }
            Cypher.executeCypher(cypher, function (err, result) {
                if (err)
                    return console.log(err);
                var totalLength = 0;
                result.forEach(function (line) {
                    totalLength += line.ids.length;
                })
                if (totalLength > Config.maxInIdsArrayLength)
                    return MainController.alert("too many results : " + totalLength + "  maximum allowed " + Config.maxInIdsArrayLength);

                var treeData = []
                result.forEach(function (line, indexLine) {
                    var children = [];
                    line.ids.forEach(function (id, indexValue) {
                        children.push({
                            id: id,
                            text: result[indexLine].names[indexValue]
                        })
                    })
                    var text = "<span style='margin :2px; border-radius: 5px;background-color: " + context.nodeColors[line.label] + "'>" + line.label + " (" + line.ids.length + ")" + "</span>"
                    var node = {
                        id: -indexLine * 10000000,
                        text: text,
                        children: children,
                    }
                    treeData.push(node)


                })
              //  self.tree = "";
                self.searchIncrement+=1;
                self.currentType = "search-"+self.searchIncrement;

              /*  children.forEach(function (child) {
                    //  child.text="<span style='background-color: "+colors[level]+"'>"+child.text+"</span>"
                    self.tree.addNode(child, parent);
                })*/


                self.setTree(treeData, null);
                UI_query.showQueryMenu();
            })


        }
        self.searchNodesDialog = function (value, _treedivId) {
            treedivId = _treedivId;
            var allProperties = Schema.getAllProperties();


            common.fillSelectOptionsWithStringArray("query_propertySelect", allProperties, true);


            $('#dbQueryFilterLabelModal').modal('show');
            $(".alert").addClass("d-none");

            $("#query_validateQueryButton").bind('click', function (target) {
                $('#dbQueryFilterLabelModal').modal('hide');
                var queryObj = UI_query.setContextQueryObjectParams();
                var whereStr = buildPaths.getWhereClauseFromQueryObject(queryObj, "n");
                var cypher = "match(n) where " + whereStr + "  return labels(n)[0] as label , collect(id(n)) as ids, collect(n." + Config.defaultNodeNameProperty + ") as names limit " + Config.maxListDisplayLimit;
                self.searchNodes(cypher);

            })


        }


        return self;


    }
)()