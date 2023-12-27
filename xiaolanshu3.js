
var obj=JSON.parse($response.body);
console.log(obj);
obj['pointListMap']=obj['pointListMap'].map(item => item === 0 ? 1 : item);
console.log(obj);
$done({body:JSON.stringify(obj)});
