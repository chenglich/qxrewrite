/*****
{
  "success": 1,
  "chart_views": 10,
  "chart_views_exceeded": true,
  "docref_allowed": false
}
*****/
var obj=JSON.parse($response.body);
console.log(obj);
obj['chart_views_exceeded']=false;
console.log(obj);
$done({body:JSON.stringify(obj)});
