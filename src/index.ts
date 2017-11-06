import * as _ from "underscore";
import * as moment from "moment";

import { TwitWrapper } from "./twit";
import { FirebaseWrapper, TextInfo } from "./firebase";

let allTexts: TextInfo[] = [];
let orderOfTweets: number = 0;

const firebase = new FirebaseWrapper();
const twit = new TwitWrapper();

function postTweet() {
  if (allTexts.length > 0) {
    if(orderOfTweets === allTexts.length) {
      allTexts = _.shuffle(allTexts);
      orderOfTweets = 0;
    }

    const selectedItem = allTexts[orderOfTweets];
    orderOfTweets = orderOfTweets + 1;

    let postSentence = null;

    const sentenceOrMeaning = _.random(100);
    if(sentenceOrMeaning % 2){
      postSentence = selectedItem.sentence;
    }else {
      postSentence = selectedItem.meaning;
    }
    twit.post(postSentence).then(() => {
      console.log("Posted tweet: ", postSentence);
    }).catch(console.error);
  }
}

function getMeaning(sentence: string) {
  let result = null;
  if (allTexts.length > 0) {
    allTexts.forEach((text) => {
      if (text.sentence === sentence) {
        result = text.meaning;
      } else if (text.meaning === sentence) {
        result = text.sentence;
      }
    });
  }
  return result;
}

// 単語帳情報を取得
firebase.subscribeText((results) => {
  allTexts = _.shuffle(results);
  orderOfTweets = 0;
});

twit.start().then(() => {
  console.log("tweet stream started!");
  twit.streamForFollowBack();
  twit.streamForReply((tweetId, inReplyToStatusId, screenName) => {
    console.log("replied! ", {tweetId, inReplyToStatusId, screenName});
    twit.get(inReplyToStatusId).then((data) => {
      const item = getMeaning(data.text);
      if (item) {
        // console.log("meaning ", {meaning: item.meaning, tweetId});
        twit.post("@" + screenName + " " + item, tweetId);
      }
    });
  });
});

// 一定時間ごとにツイート　
const timer = setInterval(()=>{
  const m = moment().add(9, "hours"); //日本時刻に合わせる
  const am7 = moment().hour(7).minute(0).second(0);
  const pm23 = moment().hour(23).minute(59).second(59);
  // console.log("Timezone: ", {m: m.format("YYYY-MM-DD HH:mm:ss"), am7: am7.format("YYYY-MM-DD HH:mm:ss"), pm23: pm23.format("YYYY-MM-DD HH:mm:ss")});
  // 夜中にツイートしない
  if(m.isAfter(am7) && m.isBefore(pm23)) {
    postTweet();
  }
}, 1000 * 60 * 60 * 2);

// 終了時にunsubとか
process.on("SIGINT", () => {
  console.log("Fihished service.");
  firebase.unsubscribeText();
  clearInterval(timer);
  firebase.dispose();
  twit.dispose();
});

