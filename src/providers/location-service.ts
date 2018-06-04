import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
/*
  Generated class for the LocationService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class LocationService {
  currentLocationID = -1;

  constructor(public http: Http) {
    console.log('Hello LocationService Provider');
  }

  public getIndex(token) {
		return this.http.get('https://www.lotrep.com/api/v1/locations?token=' + token)
			.map(retData => retData.json());
  }

  public getShow(id, token) {
    this.setLocationID(id);
		return this.http.get('https://www.lotrep.com/api/v1/locations/' + id + '?token=' + token)
			.map(retData => retData.json());
  }

  public getLocationReports(id, token, date_from, date_to) {
    return this.http.get('https://www.lotrep.com/api/v1/locations/' + id + '/reports?token=' + token + '&date_from=' + date_from + '&date_to=' + date_to)
      .map(retData => retData.json());
  }

  public getLocationStats(id, token, type) {
    return this.http.get('https://www.lotrep.com/api/v1/locations/' + id + '/stats?token=' + token + '&type=' + type)
      .map(retData => retData.json());
  }

  public setLocationID(id) {
    this.currentLocationID = id;
  }

  public getLocationID() {
    if (this.currentLocationID == null || this.currentLocationID == -1) {
      return -1;
    }
    return this.currentLocationID;
  }
}
