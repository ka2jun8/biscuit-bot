import * as _ from "underscore";

import {TwitWrapper} from "./twit";
import {FirebaseWrapper, TextInfo} from "./firebase";

let allTexts: TextInfo[] = [];

const firebase = new FirebaseWrapper();
const twit = new TwitWrapper();

function postTweet() {
  if(allTexts.length > 0) {
    const randomIndex = _.random(allTexts.length-1);
    const selectedItem = allTexts[randomIndex];
    const postSentence: string = selectedItem.sentence;
    twit.post(postSentence).then(()=>{
      console.log("Posted tweet: ", selectedItem.sentence);
    }).catch(console.error);
  }
}

function getMeaning(sentence: string) {
  let result = null;
  if(allTexts.length > 0) {
    result = allTexts.filter((text)=>{
      return text.sentence === sentence;
    })[0];
  }
  return result;
}

// 単語帳情報を取得
firebase.subscribeText((results)=>{
  allTexts = results;
});

twit.getFollower().then(()=>{
  twit.followBack();
  twit.stream((tweetId, inReplyToStatusId, screenName)=>{
    twit.get(inReplyToStatusId).then((data)=>{
      const item = getMeaning(data.text);
      if(item) {
        // console.log("meaning ", {meaning: item.meaning, tweetId});
        twit.post("@"+screenName+" "+item.meaning, tweetId);
      }
    });
  });
});

// 一定時間ごとにツイート　
// const timer = setInterval(()=>{
//   postTweet();
// }, 1000 * 60 /* * 60 */); //1時間

// 終了時にunsubとか
process.on("SIGINT", () => {
  console.log("Fihished service.");
  firebase.unsubscribeText();
  // clearInterval(timer);
  firebase.dispose();
  twit.dispose();
});

