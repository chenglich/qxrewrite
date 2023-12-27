/**********/
var obj=JSON.parse($request.body);
console.log(obj['pointListMap']);
obj['pointListMap']=obj['pointListMap'].map(item => item === 0 ? 1 : item);
console.log(obj['pointListMap']);
$done({body:JSON.stringify(obj)});
