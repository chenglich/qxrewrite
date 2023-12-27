
[rewrite_local]

https?:\/\/api\.u\.ccb\.com\/website\/player\/studyScheduleSubmit url script-request-body https://raw.githubusercontent.com/chenglich/qxrewrite/main/xiaolanshu.js


[mitm] 

hostname=api.u.ccb.com

***********************************/

function replaceArrayElements(jsonString) {
    return jsonString.replace(/("pointListMap"\s*:\s*\[)([0-9,\s]*)(\])/g, function(match, p1, p2, p3) {
        // 将数组中的数字替换为1，并保持原有数量
        return p1 + p2.replace(/\d+/g, "1") + p3;
    });
}

var body = replaceArrayElements($request.body)
$done({ body })
