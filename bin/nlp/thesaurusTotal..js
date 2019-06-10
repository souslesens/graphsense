
var fs=require("fs");


var file="D:\\Total\\docs\\nlp\\thesaurusRefTotal.json";


var str=""+fs.readFileSync(file);

var json=JSON.parse(str);



json.forEach(function(line){
    var str="";
var synonyms="";
line.synonyms.forEach(function(syn,index){
    if(index>0)
        synonyms+=";"
    synonyms+=syn.trim();

    synonyms+=";"+line.name.trim()

})
    var ancestors="";
    line.ancestors.forEach(function(ancestor,index){
        if(index>0)
            ancestors+=";"
        ancestors+=ancestor.trim()
    })
    var parent=line.ancestors[0];


  str+=line.name.trim()+"\t"+synonyms+"\t"+parent+"\t"+ancestors+""
console.log(str)

})