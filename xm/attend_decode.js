/*
 * Quantumult X script-request-body
 * 用途：记录打卡接口中的 Auth 后4位、tbUuid 后4位、locationEncrypt，并反解经纬度
 * 注意：不记录完整 Authorization
 */

const TARGET = "/smartoffice/attendservice/appattendservice/appattend/v3/addAppAttendRecord";
const STORE_KEY = "attend_decode_records";
const MAX_RECORDS = 50;

// CryptoJS CDN。如果你的 QX 环境已经内置 CryptoJS，也会直接使用内置对象。
const CRYPTO_JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js";

function getHeader(headers, name) {
  if (!headers) return "";
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) return headers[k];
  }
  return "";
}

function getKey(authLast4, tbUuidLast4) {
  if (authLast4 && tbUuidLast4) {
    return `s@_xtbg!${authLast4}${tbUuidLast4}`;
  }
  return "s@_xtbg!12345678";
}

function decryptLocationWithCryptoJS(locationEncrypt, authLast4, tbUuidLast4) {
  const keyStr = getKey(authLast4, tbUuidLast4);
  const key = CryptoJS.enc.Utf8.parse(keyStr);
  const iv = CryptoJS.enc.Utf8.parse(keyStr);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(locationEncrypt) },
    key,
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );

  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

  // 源码中明文格式是 `${lat}-${lng}`。
  // 因为纬度经度可能有负号，所以这里优先按第一个 “-” 拆分；
  // 国内坐标通常都是正数，格式一般是 30.xxx-114.xxx。
  const idx = plaintext.indexOf("-");
  if (idx === -1) {
    return {
      plaintext,
      latitude: "",
      longitude: "",
      error: "解密成功，但未找到 lat-lng 分隔符"
    };
  }

  return {
    plaintext,
    latitude: plaintext.slice(0, idx),
    longitude: plaintext.slice(idx + 1),
    error: ""
  };
}

function loadCryptoJS(callback) {
  if (typeof CryptoJS !== "undefined") {
    callback(null);
    return;
  }

  $task.fetch({
    url: CRYPTO_JS_URL,
    method: "GET"
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
  }).catch(err => {
    callback(err);
  });
}

function readRecords() {
  try {
    const raw = $prefs.valueForKey(STORE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveRecord(record) {
  const records = readRecords();
  records.unshift(record);
  while (records.length > MAX_RECORDS) records.pop();
  $prefs.setValueForKey(JSON.stringify(records), STORE_KEY);
}

function finish() {
  $done({});
}

try {
  const url = $request.url || "";

  if (!url.includes(TARGET)) {
    finish();
  } else {
    loadCryptoJS(err => {
      try {
        const headers = $request.headers || {};
        const body = $request.body || "";

        const authorization = getHeader(headers, "Authorization");
        const authLast4 = authorization ? authorization.slice(-4) : "";

        let parsed = {};
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = {};
        }

        const tbUuid = parsed.tbUuid || "";
        const tbUuidLast4 = tbUuid ? tbUuid.slice(-4) : "";

        const locationEncrypt = parsed.locationEncrypt || "";
        const city = parsed.city || "";
        const address = parsed.attendPlaceName || "";

        let decoded = {
          plaintext: "",
          latitude: "",
          longitude: "",
          error: ""
        };

        if (err) {
          decoded.error = "CryptoJS 加载失败: " + err.message;
        } else if (!locationEncrypt) {
          decoded.error = "请求体中没有 locationEncrypt";
        } else {
          decoded = decryptLocationWithCryptoJS(locationEncrypt, authLast4, tbUuidLast4);
        }

        const record = {
          time: new Date().toISOString(),
          authLast4,
          tbUuidLast4,
          locationEncrypt,
          latitude: decoded.latitude,
          longitude: decoded.longitude,
          plaintext: decoded.plaintext,
          city,
          address,
          error: decoded.error
        };

        saveRecord(record);

        console.log("[attend-decode-log] " + JSON.stringify(record, null, 2));

        const subtitle = `Auth后4位=${authLast4} / tbUuid后4位=${tbUuidLast4}`;
        const message = decoded.error
          ? `解密失败：${decoded.error}`
          : `lat=${decoded.latitude}, lng=${decoded.longitude}\n${city} ${address}`;

        $notify("打卡接口定位已解析", subtitle, message);
      } catch (e) {
        console.log("[attend-decode-log] error: " + e.message);
      }

      finish();
    });
  }
} catch (e) {
  console.log("[attend-decode-log] outer error: " + e.message);
  finish();
}
