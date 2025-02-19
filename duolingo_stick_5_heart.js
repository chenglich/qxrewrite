/**************************************

[rewrite_local]
^https?:\/\/ios-api-2\.duolingo\.com\/(2017-06-30|2023-05-23)\/batch url script-response-body https://raw.githubusercontent.com/5oops/laughing-octo-pancake/master/duolingo.com.js
^https?:\/\/ios-api-2\.duolingo\.com\/(2017-06-30|2023-05-23)\/users\/(\d+)\/available-features url script-response-body https://raw.githubusercontent.com/5oops/laughing-octo-pancake/master/duolingo.com.js
[mitm]
hostname = ios-api-2.duolingo.com, ios-api-2.duolingo.cn

const url = $request.url
const isCheckUrl = (url) => (url.includes('ios-api-2.duolingo.com/2017-06-30/batch') || url.includes('ios-api-2.duolingo.com/2023-05-23/batch') )

if (isCheckUrl(url)) {
  var rBody = $response.body;
  rBody = rBody.replace(/has_item_gold_subscription\\":\s*\w+/g, 'has_item_gold_subscription\\":true')
                .replace(/premium_free_trial_period\\":\s*\w+/g, 'premium_free_trial_period\\":false')
                .replace(/has_item_premium_subscription\\":\s*\w+/g, 'has_item_premium_subscription\\":true')
                .replace(/has_item_live_subscription\\":\s*\w+/g, 'has_item_live_subscription\\":true,\\"premium_receipt_source\\":\\"apple\\"')
                .replace(/has_item_streak_wager\\":\s*\w+/g, 'has_item_streak_wager\\":true,\\"premium_product_id\\":\\"com.duolingo.DuolingoMobile.subscription.Premium.TwelveMonth.24Q2Max.120\\",\\"premium_expected_expiration\\":1791387149000')
                .replace(/gems\\":\s*(\d+)/g, 'gems\\":99999')
                .replace(/\\"id\\":\\"timed_practice\\"\}/g, '\\"id\\":\\"timed_practice\\"},{\\"purchaseDate\\":1728261190,\\"purchasePrice\\":99,\\"id\\":\\"premium_subscription\\",\\"subscriptionInfo\\":{\\"expectedExpiration\\":1791387149,\\"isFreeTrialPeriod\\":false,\\"isInBillingRetryPeriod\\":false,\\"productId\\":\\"com.duolingo.DuolingoMobile.subscription.Premium.TwelveMonth.24Q2Max.120\\",\\"renewer\\":\\"APPLE\\",\\"renewing\\":false,\\"tier\\":\\"twelve_month\\",\\"type\\":\\"premium\\"}}')
                .replace(/premium_expected_expiration\\":\s*(\d+)/g, 'premium_expected_expiration\\":1791387149000')
                .replace(/expectedExpiration\\":\s*(\d+)/g, 'expectedExpiration\\":1791387149')
                .replace(/isFreeTrialPeriod\\":\s*\w+/g, 'isFreeTrialPeriod\\":true')
                .replace(/emailAnnouncement\\":\s*\w+/g, 'emailAnnouncement\\":true,\\"plusStatus\\":\\"PLUS",\\"maxStatus\\":\\"MAX')
                .replace(/\\"timerBoosts\\":\s*(\d+)/g, '\\"timerBoosts\\":99')
                .replace(/\\"timezone\\":\s*\\"[^\\"]+/g, '\\"timezone\\":\\"Asia/Taipei')
                .replace(/\\"utc_offset\\":\s*[^,]+/g, '\\"utc_offset\\":8.0');

  $done( { 'body': rBody } );
}
if ((url.indexOf('ios-api-2.duolingo.com/2017-06-30/users/') !== -1 || url.indexOf('ios-api-2.duolingo.com/2023-05-23/users/') !== -1 ) && url.indexOf('available-features') !== -1 ) {
    const unlock = {
        "purchasableFeatures": ["CAN_PURCHASE_IAP", "CAN_PURCHASE_SUBSCRIPTION", "CAN_PURCHASE_MAX"],
        "subscriptionFeatures": ["NO_NETWORK_ADS", "UNLIMITED_HEARTS", "LEGENDARY_LEVEL", "MISTAKES_INBOX", "MASTERY_QUIZ", "NO_SUPER_PROMOS", "LICENSED_SONGS", "CHAT_TUTORS", "FACETIME", "VIDEO_CALL_IN_PATH", "VIDEO_CALL_IN_PRACTICE_HUB","CAN_ADD_SECONDARY_MEMBERS"]
    };
    $done( { 'body': JSON.stringify(unlock) } );
}

*************************************/

const url = $request.url
const isCheckUrl = (url) => (url.includes('ios-api-2.duolingo.com/2017-06-30/batch') || url.includes('ios-api-2.duolingo.com/2023-05-23/batch') )

if (isCheckUrl(url)) {
  var rBody = $response.body;
  rBody = rBody.replace(/\\"hearts\\":\d/g, '\\"hearts\\":5');

  $done( { 'body': rBody } );
}
