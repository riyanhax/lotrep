import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';
import { FCM } from '@ionic-native/fcm';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';

/*
  Generated class for the AuthService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/

export class User {  
  email: string;
  password: string;
  token: string;
  trial: boolean;
  trial_days_left: string;
  start_at: any;

  constructor(email: string, password: string, token: string, trial: boolean, trial_days_left: any) {
    this.email = email;
    this.password = password;
    this.token = token;
    this.trial = trial;
    this.trial_days_left = trial_days_left;
    this.start_at = new Date();
  }
}

@Injectable()
export class AuthService {
	currentUser: User;

  constructor(public http: Http, private fcm: FCM, public storage: Storage, private alertCtrl: AlertController) {
		console.log('Hello AuthService Provider');
	}

	public login(credentials) {
		if (credentials.email === null || credentials.password === null || credentials.email == "" || credentials.password == "") {
      return Observable.throw("Please insert credentials");
    } else {
      return Observable.create(observer => {  
        return this.fcm.getToken().then(token => {
          this.storage.set('device_token', token);
          credentials.token = token;
          let body = 'email=' + credentials.email + '&password=' + credentials.password + '&token=' + credentials.token;
          let headers = new Headers({ 
            'Content-Type': 'application/x-www-form-urlencoded',
          });
          let options = new RequestOptions({ headers: headers });
          
          return this.http.post('https://www.lotrep.com/api/v1/authenticate', body, options)
            .map(retData => retData.json())
            .subscribe(retData => {
              let access = (retData.token) ? true : false;
              this.storage.set('token', retData.token);
              this.storage.set('trial', retData.trial);
              this.storage.set('trial_days_left', retData.trial_days_left);
              this.storage.set('start_at', new Date());
              this.storage.set('email', credentials.email);
              this.storage.set('password', credentials.password);              
              this.currentUser = new User(credentials.email, credentials.password, retData.token, retData.trial, retData.trial_days_left);
              observer.next(access);
              observer.complete();
            },
            error => {
              this.eraseStorage();
              observer.next(false);
              observer.complete();
            });
        })
      });
    }
  }
 
  public eraseStorage() {
    this.currentUser = null;
    this.storage.set('device_token', null);
    this.storage.set('token', null);
    this.storage.set('trial', null);
    this.storage.set('trial_days_left', null);
    this.storage.set('start_at', null);
    this.storage.set('email', null);
    this.storage.set('password', null);
  }

  public getUserInfo() : User {
    return this.currentUser;
  }

  public logout() {
    return Observable.create(observer => {
      this.currentUser = null;
      this.eraseStorage();
      observer.next(true);
      observer.complete();
    });
  }

  public showStatus(text) {
    let alert = this.alertCtrl.create({
      title: 'Status',
      subTitle: text,
      buttons: ['OK']
    });
    alert.present(prompt);
  }
}
