import * as admin from "firebase-admin";
import * as _ from "underscore";

// const config = require("../settings.json");
// const _serviceAccount = require("../serviceAccountKey.json");

require("dotenv").config();

const config = {
  firebase: {
    databaseURL: process.env.firebase_database_url,
    user: process.env.firebase_user,
  }
};

const serviceAccount = {
  type: process.env.firebase_type,
  project_id: process.env.firebase_project_id,
  private_key_id: process.env.firebase_private_key_id,
  private_key: process.env.firebase_private_key,
  client_email: process.env.firebase_client_email,
  client_id: process.env.firebase_client_id,
  auth_uri: process.env.firebase_auth_uri,
  token_uri: process.env.firebase_token_uri,
  auth_provider_x509_cert_url: process.env.firebase_auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.firebase_client_x509_cert_url,
};

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
      credential: admin.credential.cert(serviceAccount as any),
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


