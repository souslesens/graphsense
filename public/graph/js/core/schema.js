/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/


var Schema = (function () {
        self = {};
        var serverDir = "./config/schemas/";
        self.neo4jProxyUrl = "../../neo";
        self.serverRootUrl = "../../..";

        self.allLabelsPaths = null;
        self.subGraph;

        self.currentGraph = null;


        self.schema = {
            defaultNodeNameProperty: "name",
            labels: {},
            relations: {},
            properties: {},
            mongoCollectionMapping: {},
            fieldsSelectValues: {}
        }

        /**
         * load schema from config/schemas dir
         * if no schema call schema configDialog
         */
        self.load = function (_subGraph, callback) {
            var subGraph = _subGraph;
            Cypher.executeCypher("MATCH (n:schema) where n.name='" + subGraph + "' return n", function (err, result) {
                if (err || result.length == 0) {
                    console.log("no schema found, will create one");
                    Schema.createSchema(subGraph);

                    /*  setTimeout(function () {
                          GraphController.dispatchAction('showSchemaConfigDialog');//({create:1});
                      }, 2000)*/
                }
                else {
                    var schema = result[0].n.properties.data;
                    schema = JSON.parse(atob(schema))
                    Schema.initSchema(schema, callback);
                }


            })
        }


        /**
         * generate implicit schema and update schemaconfigDialog to modifiy it
         *
         */


        self.createSchema = function (subGraph, callback) {
            if (typeof dialog !== 'undefined') {
                $("#dialog").html("this schema is regenerating : this can last more than one minute...<br> <img id=\"waitImg\" src=\"images/waitAnimated.gif\" width=\"40px\" \>")
                dialog.dialog({title: ""});
                dialog.dialog("open");
            }


            // location.reload()

            Schema.generateNeoImplicitSchema(subGraph, true, function (err, _schema) {
                if (err) {
                    console.log(err)
                    if (callback)
                        return callback(err)
                    return $("#schemaConfig_message").html("ERROR while generating schema");
                }
                else {
                    $("#schemaConfig_message").html("Schema generated");
                    $("#schemaConfig_configSchemaDiv").css("visibility", "visible");


                    Schema.initSchema(_schema);
                    if (typeof dialog !== 'undefined') {
                        $("#dialog").html("new schema is ready : reload page to use it")
                        dialog.dialog("close");
                    }

                    if (callback)
                        return callback(null, Schema.schema)

                }
            })
        }


        self.delete = function (confirmation, callback) {
            if (confirmation && confirm("delete  this schema ?")) {
                Cypher.executeCypher("MATCH (n:schema) where n.name='" + subGraph + "' delete n", function (err, result) {
                    if (callback)
                        return callback(err, result)
                    if (err) {
                        return console.log(err);
                    }

                    return console.log(subgraph + " schema deleted");

                })


            }

        }

        self.resetSchema = function () {
            var confirmMessage = "delete  this schema and recreate one from graph database ?";
            Schema.delete(confirmMessage, function (err, result) {
                if (err)
                    return console.log(err);

                Schema.createSchema(subGraph);


            })


        }


        self.createIndex = function (property, labels) {

            if (!labels)
                labels = Schema.getAllLabelNames();
            var statements = [];
            labels.forEach(function (label) {
                statements.push({statement: "CREATE INDEX ON :" + label + "(" + property + ")"})
            })
            var payload = {
                executeStatements: 1,
                statements: statements

            }
            $.ajax(Schema.serverRootUrl + '/neo', {
                data: payload,
                dataType: "json",
                type: 'POST',

                error: function (error, ajaxOptions, thrownError) {
                    return console.log("error while indexing :" + error);
                },
                success: function (result) {
                    return console.log("indexes created");
                }
            })
        }


        self.setDefaultNodeNameProperty = function () {
            var newName = $("#schemaConfig_defaultNodeNameProperty").val();
            if (newName !== "") {
                Schema.schema.defaultNodeNameProperty = newName;
                Schema.save(subGraph)


            }
        }

        /**
         * performs initialisation of toutlesens after loading schema

         */
        self.initSchema = function (data, callback) {

            if (data.result)
                data = data.result;
            if (data) {
                if (typeof data !== "object")
                    data = JSON.parse(data);


                if (!data.defaultNodeNameProperty)
                    data.defaultNodeNameProperty = "name";

                for (var key in Schema.schema) {// pour completer le champs vides non enregistrés par Jquery
                    if (!data[key])
                        data[key] = {};
                }


                Schema.schema = data;
                if (Gparams)
                    Config.defaultNodeNameProperty = Schema.schema.defaultNodeNameProperty;
                //name  used in UI but not stored
                for (var key in Schema.schema.relations) {
                    Schema.schema.relations[key].name = key
                }

                for (var key in Schema.schema.labels) {
                    if (!Schema.schema.properties[key])
                        Schema.schema.properties[key] = {};
                    if (!Schema.schema.properties[key][Schema.schema.defaultNodeNameProperty])
                        Schema.schema.properties[key][Schema.schema.defaultNodeNameProperty] = {
                            "type": "text"
                        }
                }

                Schema.setLabelsColor();
                Schema.setLinkColors();
                if (Schema.schema.Gparams) {
                    for (var key in Schema.schema.Gparams) {
                        Gparams[key] = Schema.schema.Gparams[key];
                    }
                }

                Config.defaultNodeNameProperty = Schema.schema.defaultNodeNameProperty;

                if (callback)
                    callback(null, Schema.schema);

            }

        }

        self.save = function (subGraph, json, callback) {
            if (!json)
                json = Schema.schema;

            //name  used in UI but not stored
            for (var key in Schema.schema.relations) {
                delete Schema.schema.relations[key].name
            }

            for (var key in Schema.schema.labels) {
                if (!Schema.schema.properties[key])
                    Schema.schema.properties[key] = {};
                if (!Schema.schema.properties[key][Schema.schema.defaultNodeNameProperty])
                    Schema.schema.properties[key][Schema.schema.defaultNodeNameProperty] = {
                        "type": "text"
                    }

            }
            var schemaData = btoa(JSON.stringify(json));
            var cypherDelete = "MATCH(n:schema{name:'" + subGraph + "'}) DETACH DELETE n";
            Cypher.executeCypher(cypherDelete, function (err, result) {
                if (err) {
                    if (callback)
                        return callback(err)
                    return console.log(err)
                }

                var cypher = "CREATE (n:schema{name:'" + subGraph + "',data:'" + schemaData + "'}) return  n.name"
                //  console.log(cypher);
                Cypher.executeCypher(cypher, function (err, result) {

                    if (err) {
                        if (callback)
                            return callback(err)
                        return console.log(err)
                    }

                    Schema.schema = json;
                    if (callback) {
                        return callback(null, json);
                    }
                })
            })
        }


        self.save_file = function (subGraph, json, callback) {
            if (!json)
                json = Schema.schema;

            //name  used in UI but not stored
            for (var key in Schema.schema.relations) {
                delete Schema.schema.relations[key].name
            }

            for (var key in Schema.schema.labels) {
                if (!Schema.schema.properties[key])
                    Schema.schema.properties[key] = {};
                if (!Schema.schema.properties[key][Schema.schema.defaultNodeNameProperty])
                    Schema.schema.properties[key][Schema.schema.defaultNodeNameProperty] = {
                        "type": "text"
                    }

            }
            var payload = {
                store: 1,
                path: serverDir + subGraph + ".json",
                data: json///JSON.stringify(json)
            }
            $.ajax(Schema.serverRootUrl + '/jsonFileStorage', {
                data: payload,
                dataType: "json",
                type: 'POST',
                error: function (error, ajaxOptions, thrownError) {
                    GraphController.onErrorInfo(error)
                    if (callback)
                        return callback("error " + error)

                }
                ,
                success: function (data) {
                    Schema.schema = json;
                    if (callback)
                        return callback(null, json);

                }
            })

        }
            ,
            self.setLinkColors = function () {
                linkColors = {};
                if (Schema && Schema.schema) {
                    var i = 0;
                    for (var key in Schema.schema.relations) {
                        var relation = Schema.schema.relations[key];
                        var relKey = relation.type;
                        var p = relKey.indexOf("#");
                        if (p > -1)
                            relKey = relKey.substring(0, p);
                        if (relation.color)
                            linkColors[relKey] = relation.color;
                        else {

                            var index = (i++) % Config.palette.length;


                            linkColors[relKey] = Config.palette[index];
                        }

                    }
                    var xxx = ';'
                }
                else {
                    for (var i = 0; i < DataModel.allRelationsArray.length; i++) {
                        var index = (i) % Config.palette.length;
                        linkColors[DataModel.allRelationsArray[i]] = Config.palette[index];

                    }
                }
            }
        self.setLabelsColor = function () {
            if (Schema && Schema.schema) {
                var i = 0;
                for (var key in Schema.schema.labels) {
                    if (false && Schema.schema.labels[key].color)
                        context.nodeColors[key] = Schema.schema.labels[key].color;
                    else {
                        var index = (i++) % Config.palette.length;

                        context.nodeColors[key] = Config.palette[index];
                        console.log(index + " " + context.nodeColors[key] + " " + key)
                    }
                    if (Schema.schema.labels[key].icon == "default.png")
                        delete Schema.schema.labels[key].icon;
                }
            }
            else {
                for (var i = 0; i < DataModel.allLabels.length; i++) {
                    var label = DataModel.allLabels[i];
                    var index = i % Config.palette.length;
                    context.nodeColors[label] = Config.palette[index];
                }
            }
        }


        self.getPermittedRelations = function (label, direction) {
            if (!direction)
                direction = "normal";
            var relationsPermitted = [];
            var relations = Schema.schema.relations;
            var relationNames = [];

            for (var key in relations) {
                var relation = relations[key];
                var ok = false;
                if (relation.startLabel == label && (direction == "normal" || direction == "both"))
                    ok = true
                if (relation.endLabel == label && (direction == "inverse" || direction == "both")) {
                    relation.inverse = 1;
                    ok = true;
                }
                if (ok===true) {
                    relationNames.push(relation.type);
                    relationsPermitted.push(relation);

                }


            }
            return relationsPermitted;

        }


        self.getAllLabelNames = function () {
            var labels = [];//[""];
            for (var label in Schema.schema.labels) {
                labels.push(label);
            }
            labels.sort();
            return labels;
        }

        self.getAllRelationNames = function () {
            var relations = [];//[""];
            for (var key in relations) {
                var relation = relations[key];
                var type = relation.type;
                relTypes.push(type);
            }
            relations.sort();
            return relations;


        }
        self.getLabelProperties = function (label) {
            var properties = [];
            for (var prop in Schema.schema.properties[label]) {
                properties.push(prop);
            }
            properties.sort();
            return properties;
        }


        self.getPermittedRelTypes = function (startLabel, endLabel, inverseRelAlso) {
            relTypes = [];
            var relations = Schema.schema.relations;
            for (var key in relations) {
                var relation = relations[key];
                var type = relations[key].type;

                if (relation.startLabel == startLabel && relation.endLabel == endLabel)
                    relTypes.push(type);

                if (inverseRelAlso && relation.startLabel == endLabel && relation.endLabel == startLabel)
                    relTypes.push("-" + type);
            }
            return relTypes;
        }


        self.getPermittedLabels = function (startLabel, inverseRelAlso, withoutInverseSign) {
            labels = [];
            var relations = Schema.schema.relations;
            for (var key in relations) {
                var relation = relations[key];


                if (relation.startLabel == startLabel || !startLabel || startLabel == "")
                    if (labels.indexOf(relation.endLabel) < 0)
                        labels.push(relation.endLabel);

                if (inverseRelAlso && (relation.endLabel == startLabel || !startLabel || startLabel == ""))
                    if (labels.indexOf(relation.startLabel) < 0) {
                        if (withoutInverseSign)
                            labels.push(relation.startLabel);
                        else
                            labels.push("-" + relation.startLabel);
                    }

            }
            return labels;
        }


        self.getRelations = function (startLabel, endLabel, mongoCollection) {
            var matchingRels = []
            var relations = Schema.schema.relations;
            for (var key in relations) {
                var relation = relations[key];

                if (relation.startLabel == startLabel && relation.endLabel == endLabel)
                    matchingRels.push(relation);
                if (relation.startLabel == startLabel && endLabel == null)
                    matchingRels.push(relation);
                if (relation.endLabel == endLabel && startLabel == null)
                    matchingRels.push(relation);
                if (relation.mongoMapping && relation.mongoMapping.collection == mongoCollection)
                    matchingRels.push(relation);

            }
            return matchingRels;

        }

        self.getRelationsByType = function (type) {
            var matchingRels = []
            var relations = Schema.schema.relations;
            for (var key in relations) {
                var relation = relations[key];
                if (relation.type == type) {
                    matchingRels.push(relation)

                }
            }
            return matchingRels;

        }

        self.getLabelsDistance = function (startNode, endNode) {
            if (!startNode || !endNode || startNode.length == 0 || endNode.length == 0)
                return null;
            if (startNode == endNode) {

                return 2;
            }
            var relations = Schema.schema.relations;
            var nodesChildren = {};

            // nodes around each nodes
            for (var key in relations) {
                if (!nodesChildren[relations[key].startLabel])
                    nodesChildren[relations[key].startLabel] = [];
                if (nodesChildren[relations[key].startLabel].indexOf(relations[key].endLabel) < 0)
                    nodesChildren[relations[key].startLabel].push(relations[key].endLabel);
                if (!nodesChildren[relations[key].endLabel])
                    nodesChildren[relations[key].endLabel] = []
                if (nodesChildren[relations[key].endLabel].indexOf(relations[key].startLabel) < 0)
                    nodesChildren[relations[key].endLabel].push(relations[key].startLabel);
            }

            // transfrom each neighbour node in object
            for (var key in nodesChildren) {
                var labels2 = [];
                for (var i = 0; i < nodesChildren[key].length; i++) {
                    if (nodesChildren[key][i] != key)
                        labels2.push({name: nodesChildren[key][i]});

                }
                nodesChildren[key] = labels2;
            }


            var nodesSerie = []

            var childrenDone = {};
            //premier noeud
            nodesSerie.push({name: startNode, isVisited: true, level: 0})

            var distance;
            var iterations = 0;
            while (nodesSerie.length > 0 && (iterations++) < 1000) {

                var node = nodesSerie[nodesSerie.length - 1];//take the last Node
                childrenDone[node.name] = []
                nodesSerie.splice(nodesSerie.length - 1, 1)//remove the last node;

                for (var i = 0; i < nodesChildren[node.name].length; i++) {// for each related node
                    var child = nodesChildren[node.name][i];

                    if (childrenDone[node.name].indexOf(child.name) < 0)
                        childrenDone[node.name].push(child.name);

                    if (childrenDone[child.name] && childrenDone[child.name].indexOf(node.name) > -1)// dans ce cas on remonte au parent et on tourne en rond
                        continue;


                    if (child.name == "sentence") {
                        var xx = 1
                    }
                    if (child.name == node.name) {
                        nodesSerie.push({name: child.name, isVisited: true, level: node.level + 1})
                    }


                    if (!child.isVisited) {
                        nodesSerie.push({name: child.name, isVisited: true, level: node.level + 1})
                        if (child.name == endNode) {
                            distance = node.level + 1;
                            return distance;

                        }
                    }
                }


            }

            /*if( !distance)
                var distanceStr=prompt ("max number of relations between nodes ")
                        try{
                            distance=parseInt(distanceStr)
                        }
                        catch(e){

                        }*/
            return distance;


        }


        self.getNameProperty = function (label) {
            if (!Schema.schema)
                return "name";
            if (!label)
                return Schema.schema.defaultNodeNameProperty;
            var properties = Schema.schema.properties[label];
            for (var field in properties) {
                if (properties[field].isName)
                    return field

            }
            return Schema.schema.defaultNodeNameProperty;
        }


        self.updateRelationsModel = function (oldRelations) {
            var relationsNewModel = {}
            var relations = Schema.schema.relations;
            if (oldRelations)
                relations = oldRelations;
            for (var key in relations) {
                var properties = [];
                var relations2 = relations[key];
                if (relations2) {
                    for (var i = 0; i < relations2.length; i++) {
                        var relation = relations2[i];
                        relation.properties.forEach(function (property) {
                            if (properties.indexOf(property) < 0)
                                properties.push(property);
                        })
                        if (relation.direction == "inverse")
                            continue;
                        delete relation.direction;
                        var name = key;
                        if (i > 0)
                            var name = key + "--" + (i);
                        relation.properties.subGraph
                        relation.type = key;
                        relation.properties = properties;

                        relationsNewModel[name] = relation;

                    }
                }
            }

            //      console.log(JSON.stringify(self.schema, undefined, 4));

            if (true) {//confirm("save new Schema ?")) {
                Schema.schema.relations = relationsNewModel;
                Schema.save(self.subGraph, self.schema)

            }
            return relationsNewModel;

        }

        self.generateNeoImplicitSchema = function (subGraph, save, callback) {
            if (Schema.schema && !save)
                return;
            var properties = {};
            var labels = {};
            var k = 0;
            DataModel.initNeoModel(subGraph, function () {
                for (var label in DataModel.labels) {
                    labels[label] = {icon: "default.png"};
                    if (Gparams && Config.palette) {
                        var index = (k++) % Config.palette.length;
                        labels[label].color = Config.palette[index];


                    }
                    if (!properties[label])
                        properties[label] = {};
                    var neoProps = DataModel.labels[label];
                    for (var i = 0; i < neoProps.length; i++) {
                        properties[label][neoProps[i]] = {
                            type: "text",
                        }

                    }
                }
                var implShema = {
                    labels: labels,
                    relations: Schema.updateRelationsModel(DataModel.allRelations),
                    properties: properties,
                    fieldsSelectValues: {},
                    defaultNodeNameProperty: "name",
                    Gparams: {}

                }
                if (save) {
                    // console.log(JSON.stringify(implShema, undefined, 4));
                    Schema.save(subGraph, implShema, callback);
                }
            })


        }





        return self;
    }
)
()
