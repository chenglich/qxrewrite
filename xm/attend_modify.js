/*
 * Quantumult X - attend_modify.js
 */

// 可留空；留空则使用原请求里的 city / attendPlaceName
const TEST_CITY = "武汉市";
const TEST_ADDRESS = "中国湖北省武汉市洪山区关山街道楚平路";

const CRYPTO_JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js";

function randomLocation() {
  const centerLat = 30.49463277971045;
  const centerLng = 114.38134364750097;

  // 控制随机半径，单位：米
  // 根据你给的样本，建议 1 ~ 5 米
  const radiusMeters = Math.random() * 5;

  // 随机方向
  const angle = Math.random() * 2 * Math.PI;

  // 米转经纬度
  const deltaLat = (radiusMeters * Math.cos(angle)) / 111320;
  const deltaLng = (radiusMeters * Math.sin(angle)) / (111320 * Math.cos(centerLat * Math.PI / 180));

  return {
    latitude: String(centerLat + deltaLat),
    longitude: String(centerLng + deltaLng)
  };
}


function doneOriginal() {
  $done({});
}

function getHeader(headers, name) {
  if (!headers) return "";
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) return headers[k];
  }
  return "";
}

function getLast4(value) {
  if (!value || typeof value !== "string") return "";
  return value.slice(-4);
}

function loadCryptoJS(callback) {
  if (typeof CryptoJS !== "undefined") {
    callback(null);
    return;
  }

  $task.fetch({
    url: CRYPTO_JS_URL,
    method: "GET",
    headers: { "User-Agent": "QuantumultX" }
  }).then(resp => {
    try {
      eval(resp.body);
      if (typeof CryptoJS === "undefined") {
        callback(new Error("CryptoJS 加载后仍不可用"));
      } else {
        callback(null);
      }
    } catch (e) {
      callback(e);
    }
  }).catch(callback);
}

function getAttendEncryptKey(authorization, tbUuid) {
  const authLast4 = getLast4(authorization);
  const tbUuidLast4 = getLast4(tbUuid);

  if (authLast4 && tbUuidLast4) {
    return `s@_xtbg!${authLast4}${tbUuidLast4}`;
  }

  return "s@_xtbg!12345678";
}

function encryptLocation(lat, lng, authorization, tbUuid) {
  const plaintext = `${lat}-${lng}`;
  const keyStr = getAttendEncryptKey(authorization, tbUuid);

  const key = CryptoJS.enc.Utf8.parse(keyStr);
  const iv = CryptoJS.enc.Utf8.parse(keyStr);

  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(plaintext),
    key,
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );

  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
}

function buildValidatePayload(originalBody, authorization) {

  const loc = randomLocation();
  const TEST_LAT = loc.latitude;
  const TEST_LNG = loc.longitude;

  const tbUuid = originalBody.tbUuid;
  const city = TEST_CITY;
  const attendPlaceName = TEST_ADDRESS;

  const locationEncrypt = encryptLocation(TEST_LAT, TEST_LNG, authorization, tbUuid);

  return {
    ...originalBody,
    city,
    attendPlaceName,
    locationEncrypt
  };
}

try {

    loadCryptoJS(err => {
      if (err) {
        console.log("[attend_modify] CryptoJS 加载失败: " + err.message);
        $notify("attend_modify 测试失败", "CryptoJS 加载失败", err.message);
        doneOriginal();
        return;
      }

      try {
        const headers = $request.headers || {};
        const authorization = getHeader(headers, "Authorization");

        if (!authorization) {
          throw new Error("原请求中未找到 Authorization");
        }

        let originalBody = {};
        try {
          originalBody = JSON.parse($request.body || "{}");
        } catch (e) {
          throw new Error("原请求 body 不是合法 JSON");
        }

        const payload = buildValidatePayload(originalBody, authorization);

        console.log("[attend_modify] success.");
        $done({body:JSON.stringify(payload)});
        
      } catch (e) {
        console.log("[attend_modify] 构造测试请求失败: " + e.message);
        doneOriginal();
      }
    });
  
} catch (e) {
  console.log("[attend_modify] 外层异常: " + e.message);
  doneOriginal();
}
