

var obj=JSON.parse($response.body);
obj['pointListMap']=obj['pointListMap'].map(item => item === 0 ? 1 : item);
$done({body:JSON.stringify(obj)});
