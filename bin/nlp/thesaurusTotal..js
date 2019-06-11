
var fs=require("fs");


//var file="D:\\Total\\docs\\nlp\\thesaurusRefTotal.json";

var file="D:\\Total\\graphNLP\\Thesaurus_CTG_Skos_V1.6_201905.xml.json"
var str=""+fs.readFileSync(file);

var json=JSON.parse(str);



json.forEach(function(line){
    var str="";
var synonyms="";
line.data.synonyms.forEach(function(syn,index){
    if(index>0)
        synonyms+=";"
    synonyms+=syn.trim();



})
    if(synonyms!="")
    synonyms+=";"
    synonyms+=line.text.trim();

synonyms=synonyms.toLowerCase()

    var ancestors="";
  /*  line.ancestors.forEach(function(ancestor,index){
        if(index>0)
            ancestors+=";"
        ancestors+=ancestor.trim()
    })*/
    var ancestors=line.parent.substring(line.parent.indexOf("#")+1);
    ancestors=ancestors.replace(/\-/g,";")
    ancestorsArray=ancestors.split(";")
    var parent=ancestorsArray[ancestorsArray.length-1];


  str+=line.text.trim()+"\t"+synonyms+"\t"+parent+"\t"+ancestors+""
console.log(str)

})