import * as Twit from "twit";
import * as _ from "underscore";

let config: any = {};
try {
  config = require("../settings.json");
}catch(e) {
  require("dotenv").config();
  config = {
    twitter: {
      consumer_key: process.env.twitter_consumer_key,
      consumer_secret: process.env.twitter_consumer_secret,
      access_token: process.env.twitter_access_token,
      access_token_secret: process.env.twitter_access_token_secret,
    },
  };
}

const twitConfig = _.assign({}, config.twitter, {timeout_ms: 60*1000});
const TWITTER_ID = "822979431006228480";

export class TwitWrapper {
  T: Twit = null;
  followerIds: number[] = [];
  userStream: Twit.Stream = null;
  textStream: Twit.Stream = null;
  timers = [];

  constructor() {
    this.T = new Twit(twitConfig);
  }

  get(id: string) {
    return new Promise<any>((resolve, reject)=>{
      this.T.get("statuses/show/:id", {id}, (err, data, response) => {
        if(err){
          console.error("get error", err);
          reject();
        }else {
          // console.log("get data", data);
          resolve(data);
      }
      });
    });
  }

  post(sentence: string, inReplyToStatusId?: string) {
    return new Promise<any>((resolve, reject)=>{
      let param: any = {status: sentence};
      if(inReplyToStatusId) {
        param.in_reply_to_status_id = inReplyToStatusId;
      }
      this.T.post("statuses/update", param, (err, data, response) => {
        if(err){
          console.error("post error", err);
          reject();
        }else {
          // console.log("post tweet ", (data as any).text);
          resolve();
        }
      });
    });
  }

  getFollower() {
    return new Promise<any>((resolve, reject)=>{
      this.T.get("followers/ids", {}, (err, data, response) => {
        if(err){
          console.error("post error", err);
          reject();
        }else {
          this.followerIds = (data as any).ids;
          resolve();
        }
      });
    });
  }

  // TODO 鍵垢のフォロバはできないっぽい？
  followBack() {
    this.userStream = this.T.stream("user");
    this.userStream.on("follow", (event)=>{
      if(event.source.id_str !== TWITTER_ID) {
        console.log("follow user screen_name: ", event.source.screen_name);
        this.T.post("friendships/create", {user_id: event.source.id_str});
      }
    });

    // const timer = setTimeout(()=>{
    //   this.userStream.stop();
    //   console.log("stoped streaming.");
    // }, 30000);
    // this.timers.push(timer);
  }

  stream(callback: (tweetId, replyId, userId)=>void) {
    this.textStream = this.T.stream("statuses/filter", {track: ["@mccookie0120"]});
    this.textStream.on("tweet", (tweet) => {
      // console.log("reply: ", tweet);
      callback(tweet.id_str, tweet.in_reply_to_status_id, tweet.user.screen_name);
    });
    
    // const timer = setTimeout(()=>{
    //   this.textStream.stop();
    //   console.log("stoped streaming.");
    // }, 30000);
    // this.timers.push(timer);
  }

  dispose() {
    if(this.userStream && this.textStream){
      this.userStream.stop();
      this.textStream.stop();
      this.timers.forEach((timer)=>{
        clearTimeout(timer);
      });
      this.userStream = null;
      this.textStream = null;
    }
  }

}
