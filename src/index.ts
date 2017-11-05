import * as _ from "underscore";

import { TwitWrapper } from "./twit";
import { FirebaseWrapper, TextInfo } from "./firebase";

let allTexts: TextInfo[] = [];

const firebase = new FirebaseWrapper();
const twit = new TwitWrapper();

function postTweet() {
  if (allTexts.length > 0) {
    const randomIndex = _.random(allTexts.length - 1);
    const selectedItem = allTexts[randomIndex];
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
  allTexts = results;
});

twit.getFollower().then(() => {
  twit.followBack();
  twit.stream((tweetId, inReplyToStatusId, screenName) => {
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
  postTweet();
}, 1000 * 60 * 60 * 3);

// 終了時にunsubとか
process.on("SIGINT", () => {
  console.log("Fihished service.");
  firebase.unsubscribeText();
  clearInterval(timer);
  firebase.dispose();
  twit.dispose();
});

