
[rewrite_local]

https?:\/\/api\.u\.ccb\.com\/website\/player\/studypointview url script-response-body https://raw.githubusercontent.com/chenglich/qxrewrite/main/xiaolanshu2.js

[mitm] 

hostname=api.u.ccb.com

***********************************/
var body = $response.body.replace('0,', '1,')

$done({ body })
