import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';

/*
  Generated class for the RequesterService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class RequesterService {

  	constructor(public http: Http) {
    	console.log('Hello RequesterService Provider');
 	}

	public getLocationsAndTemplates(request_method, token) {
		var url = 'https://www.lotrep.com/api/v1/requester';
		if (request_method == "sms") {
			url += "/sms";
		}
		url += "?token=" + token;

	  	return this.http.get(url)
		  .map(retData => retData.json());
  	}

	public sendMessage(request_method, recipients, company, subject, content, token, own_email = "") {
		var url = "https://www.lotrep.com/api/v1/requester";

		let body = "recipients=" + recipients + "&company=" + company + "&content=" + content;
		let headers = new Headers({
			'Content-Type': 'application/x-www-form-urlencoded',
		});
		let options = new RequestOptions({ headers: headers });

		if (request_method == "sms") {
			url += "/sms?token=" + token;
		} else {
			body += "&subject="+ subject + "&own_email=" + own_email;
			url += "?token=" + token;
		}

		return this.http.post(url, body, options)
			.map(retData => retData.json());
	}
}
