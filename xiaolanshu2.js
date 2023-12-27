/******
[rewrite_local]

https?:\/\/api\.u\.ccb\.com\/website\/player\/studypointview url script-response-body
https://raw.githubusercontent.com/chenglich/qxrewrite/main/xiaolanshu2.js

[mitm] 

hostname=api.u.ccb.com
*******/

console.log($response.body);
var body = $response.body.replace(/0,/g, '1,');
console.log(body);

$done({ body });
