import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { HttpModule } from '@angular/http';
import { FCM } from '@ionic-native/fcm';
import { IonicStorageModule } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { ChartModule } from 'angular2-highcharts';
import * as highcharts from 'Highcharts';


import { AuthService } from './../providers/auth-service';
import { LocationService } from './../providers/location-service';
import { FeedService } from './../providers/feed-service';
import { RequesterService } from './../providers/requester-service';
import { SupportService } from './../providers/support-service';

import { MyApp } from './app.component';
import { Login } from '../pages/login/login';
import { TabsPage } from '../pages/tabs/tabs';
import { HomePage } from '../pages/home/home';
import { Domain } from '../pages/home/home';
import { ReviewsFeed } from '../pages/reviews-feed/reviews-feed';
import { ReviewRequester } from '../pages/review-requester/review-requester';
import { Support } from '../pages/support/support';
import { Stats } from '../pages/stats/stats';

@NgModule({
  declarations: [
    MyApp,
    Login,
    TabsPage,
    HomePage,
    ReviewsFeed,
    ReviewRequester,
    Domain,
    Stats,
    Support
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    ChartModule.forRoot(highcharts),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    Login,
    TabsPage,
    HomePage,
    ReviewsFeed,
    ReviewRequester,
    Domain,
    Stats,
    Support
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    FCM,
    AuthService,
    LocationService,
    FeedService,
    RequesterService,
    SupportService,
    DatePipe
  ]
})
export class AppModule {}
