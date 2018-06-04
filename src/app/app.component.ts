import { Component } from '@angular/core';
import { App, Platform, AlertController, ToastController, LoadingController, Loading, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { FCM } from '@ionic-native/fcm';
import { Storage } from '@ionic/storage';

import { AuthService } from '../providers/auth-service';
import { TabsPage } from '../pages/tabs/tabs';
import { Login } from '../pages/login/login';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {  
  
  loading: Loading;  

  rootPage: any;
  // rootPage: any = TabsPage;
  credentials = {
    email: '',
    password: ''
  };

  constructor(protected app: App, platform: Platform, statusBar: StatusBar, public splashScreen: SplashScreen, private fcm: FCM, public storage: Storage, private auth: AuthService, public alertCtrl: AlertController, private toastCtrl: ToastController, private loadingCtrl: LoadingController, public events: Events) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      this.init_notification();
    });
  }

  public init_notification() {
    this.fcm.onTokenRefresh().subscribe(token => {
      this.login_backend_register_token();
    })

    this.fcm.getToken().then(token => {
      this.login_backend_register_token();
    })

    this.fcm.onNotification().subscribe(data => {
      if (data.wasTapped) {
        console.log("Received in background");
        let reviewID = data.review_id;
        var cur_views = this.app.getActiveNav().getViews();
        if (cur_views.length == 0) {   
          this.storage.set('new_review_id', reviewID);
          this.login_backend_register_token();
        }
        else if (cur_views[0].name != "Login" && cur_views[0].name != "ReviewsFeed") {
          this.storage.set('new_review_id', reviewID);
          this.app.getActiveNav().parent.select(1);
        } 
        else if (cur_views[0].name == "Login") {
          this.showToast("You need to sign in first.", 2000);
        } else {
          this.events.publish('functionCall:viewFeed', data.review_id);
        }
      } else {
        console.log("Received in foreground");
        let confirmAlert = this.alertCtrl.create({
          title: data.title,
          message: data.body,
          buttons: [{
            text: 'Ignore',
            role: 'cancel'
          }, {
            text: 'View',
            handler: () => {
              let curViewName = this.app.getActiveNav().getViews()[0].name;
              if (curViewName != "Login" && curViewName != "ReviewsFeed") {
                let reviewID = data.review_id;
                this.storage.set('new_review_id', reviewID);
                this.app.getActiveNav().parent.select(1);
              } else if (curViewName == "Login") {
                this.showToast("You need to sign in first.", 2000);
              } else {
                this.events.publish('functionCall:viewFeed', data.review_id);
              }
            }
          }]
        });
        confirmAlert.present();
      };
    })
  }

  public login_backend_register_token() {    
    this.storage.get("email").then(
      (value) => {
        if (value != null && value != "") {
          this.credentials.email = value;
          this.storage.get("password").then(
            (value) => {              
              if (value != null && value != "") {
                this.credentials.password = value;
                this.auth.login(this.credentials).subscribe(
                  allowed => {
                    this.splashScreen.hide();
                    if (allowed) {
                      this.rootPage = TabsPage;
                    } else {
                      this.rootPage = Login;
                    }
                  },
                  error => {
                    this.splashScreen.hide();
                    this.rootPage = Login;                 
                  }
                );
              } else {
                this.splashScreen.hide();
                this.rootPage = Login;
              }
            }).catch(() => {
              this.splashScreen.hide();
              this.rootPage = Login;
            });
        } else {
          this.splashScreen.hide();
          this.rootPage = Login;
        }

      }).catch(() => {
        this.splashScreen.hide();
        this.rootPage = Login;
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

  public showToast(text, delay) {
    let toast = this.toastCtrl.create({
      message: text,
      position: 'middle',
      duration: delay
    });
    toast.present();
  }

  public showLoading(content = 'Please wait...') {
    this.loading = this.loadingCtrl.create({
      content: content,
      dismissOnPageChange: true
    });
    this.loading.present();
  }

}