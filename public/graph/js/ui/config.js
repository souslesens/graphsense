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
 * copies of the Software, and to permit persons to w
 * hom the Software is
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
var serverRootUrl = "";
var Config = {


    trees: {
        "FunctionalClass": {
            label: "FunctionalClass",
            relType:"inverse",
            rootSelector:"Name='Root'"
        },
        "PhysicalClass": {
            label: "PhysicalClass",
            relType:"inverse",
            rootSelector:"Name='Root'"
        },
        "Component": {
            label: "Component",
            relType:"normal",
            rootSelector:"Name='Component'"
        },
        "Equipment": {
            label: "Equipment",
            relType:"normal",
            rootSelector:"Name='Equipment'"
        },
    }
    ,

    plugins: {paragraphEntitiesGraph:true},
    displayVersion: "1_googleLike",
    user: "anonymous",


    //Graph display defaults***************************
    visjs: {
        defaultNodeSize: 10,
        defaultIconSize:30,
        defaultTextSize: 18,
        defaultNodeColor:"#ccc",
        defaultNodeShape: "box",
        defaultNodeShape: "dot",
        defaultLayout: "random",
        graphBackgroundColor:"#999",


    },
    datatablesBackgroundColor:"#fff",
//?? à supprimer ?
    shortestPathMaxDistanceTest: 8,
    circleR: 15,
    nodeMaxTextLength: 40,


    searchNodeAutocompletion: true,
    queryInElasticSearch: false,
    ElasticResultMaxSize: 1000,


    //init defaults*******************************
    defaultSubGraph: "DB_",
    visibleLinkProperty: null,
    logLevel: 5,
    readOnly: true,
    showRelationAttrs: true,
    startWithBulkGraphView: false,
    defaultNodeNameProperty: "name",
    defaultQueryDepth: 1,
    defaultGraphtype: "FLOWER",
    graphNavigationMode: "expandNode",
    modifyMode: 'onList',//''onList',
    useVisjsNetworkgraph: true,
    graphAllowPaint: true,
    allowOrphanNodesInGraphQuery: true,

    searchInputKeyDelay: 500,
    searchInputMinLength: 2,
    showRelationNames: true,
    limitToOptimizeGraphOptions: 1000,


//limits************************************
    maxResultSupported: 5000,
    graphMaxDataLengthToDisplayGraphDirectly: 2000,
    bulkGraphViewMaxNodesToDrawLinks: 1000,
    maxListDisplayLimit: 1500,
    maxInIdsArrayLength: 500,

    maxDepthExplorationAroundNode: 3,
    maxNodesForRelNamesOnGraph: 100,
    showLabelsMaxNumOfNodes: 4000,//in fact relations


    //urls************************
    httpProxyUrl: serverRootUrl + "/http",
    neo4jProxyUrl: serverRootUrl + "/neo",
    rdfProxyUrl: serverRootUrl + "/rdf",
    restProxyUrl: serverRootUrl + "/rest",
    mongoProxyUrl: serverRootUrl + "/source",
    uploadToNeo: serverRootUrl + "/uploadToNeo",
    storedParamsUrl: serverRootUrl + "/storedParams",
    imagesRootPath: serverRootUrl + "/files/albumPhotos/",


    //divs size*************************
    rightPanelWidth: 380,
    infosAnalyzePanelHeight: 300,


    //durations************************************
    durationMsecBeforeGraphStop: 8000,
    forceAnimationDuration: 2000,


    //others****************************************


    lang: "EN",
    profiles: {
        minimum: {
            hide: ["lang_52", "lang_62", "listDownloadButton", "div_externalRessources", "photoControls"],
            disable: ["listDownloadButton"]
        },
        all: {
            hide: [],
            disable: []
        }
    },
    currentProfile: "all",//minimum ,all
    navigationStyle: "",// , "jpt" // Jean Paul


    outlineColor: "grey",
    outlineEdgeWidth: 10,
    outlineTextColor: "red",

    minOpacity: .3,
    d3ForceParams: {distance: 200, charge: -500, gravity: .25},
    htmlOutputWithAttrs: true,

    isInframe: false,
    treeGraphVertSpacing: 35,
    smallDialogSize: {w: 300, h: 400},
    bigDialogSize: {w: 1000, h: 800},
    showBItab: false,
    gantt: {
        name: "nom",
        startField: "datedebut",
        endField: "datefin",
    },

    /*   palette: ['#B39BAB', '#FF78FF', '#A84F02', '#A8A302', '#0056B3',
           '#B354B3', '#FFD900', '#B37A00', '#B3B005', '#007DFF', '#F5ED02',
           '#F67502', '#B35905', '#FFFB08', '#FF7D07', '#FFDEF4',]
   ,*/

//http://tools.medialab.sciences-po.fr/iwanthue/palettes.php
    palette: [
        "#0072d5",
        '#FF7D07',
        "#c00000",
        '#FFD900',
        '#B354B3',
        "#a6f1ff",
        "#007aa4",
        "#584f99",
        "#cd4850",
        "#005d96",
        "#ffc6ff",
        '#007DFF',
        "#ffc36f",
        "#ff6983",
        "#7fef11",
        '#B3B005',
    ],
    paletteX: [
        '#F5ED02',
        '#007DFF',
        '#B354B3',
        '#FF7D07',
        '#005699',
        '#A84F02',
        '#A8A302',
        '#B3B005',
        '#007DFF',
        '#B35905',
        '#FFD900',
        '#FF78FF',
        '#B37A00',


        '#F67502',

        '#FFFB08',

        '#B39BAB',
        '#FFDEF4',]


    , "relationPaletteOld": [
        "#352961",
        "#774181",
        "#33313b",
        "#5a3921",
        "#6b8c42",
        "#7bc67b",
        "#007880",
        "#62374e",
    ], "relationPalette": [
    "#f4c4c4",
    "#f9d0d0",
    "#fff8e8",
    "#fff8d0",
    "#f9f4c6"

   ]
   /* , "relationPalette": [
        "#d9d7dc",
        "#c8bac1",
        "#d5d7cc",
        "#ceccd7",
        "#c7dfdf",
        "#fff0f0",
        "#ffebe2",
        "#ddb9c3",
    ]*/
}





/*
 * palette : [ '#0056B3', '#007DFF', '#A84F02', '#A8A302', '#B354B3', '#B35905',
 * '#B37A00', '#B39BAB', '#B3B005', '#F5ED02', '#F67502', '#FF78FF', '#FF7D07',
 * '#FFD900', '#FFDEF4', '#FFFB08', ]
 */