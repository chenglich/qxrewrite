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

  const radiusMeters = Math.random() * 5;
  const angle = Math.random() * 2 * Math.PI;

  const deltaLat = (radiusMeters * Math.cos(angle)) / 111320;
  const deltaLng =
    (radiusMeters * Math.sin(angle)) /
    (111320 * Math.cos(centerLat * Math.PI / 180));

  return {
    latitude: String(centerLat + deltaLat),
    longitude: String(centerLng + deltaLng),
    radiusMeters,
    angle
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

function maskAuthorization(auth) {
  if (!auth || typeof auth !== "string") return "";
  if (auth.length <= 12) return auth.slice(0, 2) + "***" + auth.slice(-2);
  return auth.slice(0, 8) + "***" + auth.slice(-4);
}

function safeHeaders(headers) {
  const copied = { ...(headers || {}) };

  for (const k of Object.keys(copied)) {
    if (k.toLowerCase() === "authorization") {
      copied[k] = maskAuthorization(String(copied[k]));
    }
  }

  return copied;
}

function prettyJson(value) {
  try {
    if (typeof value === "string") {
      return JSON.stringify(JSON.parse(value), null, 2);
    }
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
}

function logBlock(title, data) {
  console.log("\n========== " + title + " ==========");
  if (typeof data === "string") {
    console.log(data);
  } else {
    console.log(prettyJson(data));
  }
  console.log("========== END " + title + " ==========\n");
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

  return {
    plaintext,
    keyStr,
    locationEncrypt: CryptoJS.enc.Base64.stringify(encrypted.ciphertext)
  };
}

function buildValidatePayload(originalBody, authorization) {
  const loc = randomLocation();

  const TEST_LAT = loc.latitude;
  const TEST_LNG = loc.longitude;

  const tbUuid = originalBody.tbUuid || "";
  const city = TEST_CITY || originalBody.city || "";
  const attendPlaceName = TEST_ADDRESS || originalBody.attendPlaceName || "";

  const encrypted = encryptLocation(TEST_LAT, TEST_LNG, authorization, tbUuid);

  logBlock("随机坐标信息", {
    testLat: TEST_LAT,
    testLng: TEST_LNG,
    radiusMeters: loc.radiusMeters,
    angle: loc.angle
  });

  logBlock("加密信息", {
    plaintext: encrypted.plaintext,
    authLast4: getLast4(authorization),
    tbUuidLast4: getLast4(tbUuid),
    keyPreview: encrypted.keyStr,
    locationEncrypt: encrypted.locationEncrypt
  });

  return {
    ...originalBody,
    city,
    attendPlaceName,
    locationEncrypt: encrypted.locationEncrypt
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
      const method = $request.method || "";
      const url = $request.url || "";
      const rawBody = $request.body || "";

      const authorization = getHeader(headers, "Authorization");

      logBlock("原始请求基础信息", {
        method,
        url
      });

      logBlock("原始请求 Headers，Authorization 已脱敏", safeHeaders(headers));
      logBlock("原始请求 Body", rawBody);

      if (!authorization) {
        throw new Error("原请求中未找到 Authorization");
      }

      let originalBody = {};
      try {
        originalBody = JSON.parse(rawBody || "{}");
      } catch (e) {
        throw new Error("原请求 body 不是合法 JSON");
      }

      const payload = buildValidatePayload(originalBody, authorization);

      const newHeaders = { ...headers };
      newHeaders["Content-Type"] = "application/json;charset=utf-8";
      delete newHeaders["Content-Length"];
      delete newHeaders["content-length"];

      const newBody = JSON.stringify(payload);

      logBlock("修改后的请求 Headers，Authorization 已脱敏", safeHeaders(newHeaders));
      logBlock("修改后的请求 Body", newBody);

      logBlock("修改摘要", {
        oldCity: originalBody.city,
        newCity: payload.city,
        oldAttendPlaceName: originalBody.attendPlaceName,
        newAttendPlaceName: payload.attendPlaceName,
        oldLocationEncrypt: originalBody.locationEncrypt,
        newLocationEncrypt: payload.locationEncrypt
      });

      console.log("[attend_modify] success.");

      $done({
        headers: newHeaders,
        body: newBody
      });
    } catch (e) {
      console.log("[attend_modify] 构造测试请求失败: " + e.message);
      doneOriginal();
    }
  });
} catch (e) {
  console.log("[attend_modify] 外层异常: " + e.message);
  doneOriginal();
}
