import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
/*
  Generated class for the SupportService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class SupportService {

  constructor(public http: Http) {
    console.log('Hello SupportService Provider');
  }

  sendMessage(subject, message, token) {
	  let body = 'subject=' + subject + '&message=' + message;
	  let headers = new Headers({
		  'Content-Type': 'application/x-www-form-urlencoded',
	  });
	  let options = new RequestOptions({ headers: headers });

	  var url = 'https://www.lotrep.com/api/v1/support?token=' + token;
	  return this.http.post(url, body, options)
		  .map(retData => retData.json());
  }
}
