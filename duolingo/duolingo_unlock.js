if ((url.indexOf('ios-api-2.duolingo.cn/2017-06-30/users/') !== -1 || url.indexOf('ios-api-2.duolingo.com/2023-05-23/users/') !== -1 ) && url.indexOf('available-features') !== -1 ) {
  console.log("duolingo unlock start...")
    const unlock = {
        "purchasableFeatures": ["CAN_PURCHASE_IAP", "CAN_PURCHASE_SUBSCRIPTION", "CAN_PURCHASE_MAX"],
        "subscriptionFeatures": ["NO_NETWORK_ADS", "UNLIMITED_HEARTS", "LEGENDARY_LEVEL", "MISTAKES_INBOX", "MASTERY_QUIZ", "NO_SUPER_PROMOS", "LICENSED_SONGS", "CAN_ADD_SECONDARY_MEMBERS"]
      //"CHAT_TUTORS", "FACETIME", "VIDEO_CALL_IN_PATH", "VIDEO_CALL_IN_PRACTICE_HUB",
    };
    $done( { 'body': JSON.stringify(unlock) } );
  console.log("duolingo unlock end...")
}
