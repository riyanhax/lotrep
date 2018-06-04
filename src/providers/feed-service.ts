import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
/*
  Generated class for the FeedService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class FeedService {

  constructor(public http: Http) {
    console.log('Hello FeedService Provider');
  }

  public getFeeds(token, page, per_page, source_id = -1, rating = -1, search_key = "all", source = "all") {
    var url = 'https://www.lotrep.com/api/v1/feed?token=' + token + '&page=' + page + '&per_page=' + per_page;
    if (source_id != -1) url += ('&source_id=' + source_id);
    if (source != "all") url += ('&source=' + source);
    if (rating != -1) url += ('&rating=' + rating);
    if (search_key != "") url += ('&search_key=' + search_key);

		return this.http.get(url)
		  .map(retData => retData.json());
  }

  public getReviewByID(token, id) {
    var url = 'https://www.lotrep.com/api/v1/review/' + id + '?token=' + token;

    return this.http.get(url)
      .map(retData => retData.json());
  }

  public storeReviewByID(token, id, message) {
    let body = 'review_id=' + id + '&message=' + message;
    let headers = new Headers({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    let options = new RequestOptions({ headers: headers });

    var url = 'https://www.lotrep.com/api/v1/review/reply?token=' + token;
    return this.http.post(url, body, options)
      .map(retData => retData.json());
  }
}
