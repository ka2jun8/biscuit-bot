import * as admin from "firebase-admin";
import * as _ from "underscore";

const config = require("../settings.json");
const serviceAccount = require("../serviceAccountKey.json");


export interface ListInfo {
  __id?: string;
  title: string;
  updateDate?: number;
  createDate?: number;
}

export interface ResultListInfoMap {
  [id: string]: ListInfo;
}

export interface TextInfo {
  __id?: string;
  sentence: string;
  meaning: string;
  private?: boolean;
  comment?: string;
  image?: string;
  url?: string;
  updateDate?: number;
  createDate?: number;
}

export interface EditTextInfo extends TextInfo {
  listId: string;
}

export interface ResultAllTextMap {
  [listId: string]: ResultTextInfoMap;
}

export interface ResultTextInfoMap {
  [id: string]: TextInfo;
}

export interface AllTextMap {
  [listId: string]: TextInfo[];
}

export class FirebaseWrapper {
  app: admin.app.App = null;

  constructor() {
    this.app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: config.firebase.databaseURL,
    });

  }

  getUserList(): Promise<any> {
    return this.app.auth().listUsers();
  }
  
  getAllTexts(): Promise<TextInfo[]> {
    return new Promise((resolve, reject) => {
      const userref: admin.database.Reference
        = this.app.database().ref("users" + "/"+config.firebase.user+"/text");
      userref.once("value", (snapshot) => { // TODO .onにしてsubscribeする？
        const values: ResultAllTextMap = snapshot.val();
        const results = this.textsToArray(values);
        resolve(results);
      });
    });
  }
  
  subscribeText(callback: (texts: TextInfo[])=>void) {
    const userref: admin.database.Reference
    = this.app.database().ref("users" + "/"+config.firebase.user+"/text");
    userref.on("value", (snapshot)=>{
      const values = snapshot.val();
      const results = this.textsToArray(values);
      console.log("firebase: update text: ", results.length);
      callback(results);
    });

  }

  unsubscribeText() {
    const userref: admin.database.Reference
    = this.app.database().ref("users" + "/"+config.firebase.user+"/text");
    userref.off();
  }

  textsToArray(values: ResultAllTextMap): TextInfo[] {
    let results: TextInfo[] = [];
    if(values){
      Object.keys(values).forEach((listId)=>{
        const resultTextInfoMap = values[listId];
        Object.keys(resultTextInfoMap).forEach((textId)=>{
          results.push(resultTextInfoMap[textId]);
        });
      });
    }else {
      console.warn("You don't have any items.");
    }
    return results;
  }

  dispose() {
    this.app.delete();
  }
}


