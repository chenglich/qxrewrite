console.log("duolingo hearts start");
const url = $request.url
const isCheckUrl = (url) => (url.includes('ios-api-2.duolingo.cn/2017-06-30/batch') || url.includes('ios-api-2.duolingo.cn/2023-05-23/batch') )

if (isCheckUrl(url)) {
  console.log(url)
}
