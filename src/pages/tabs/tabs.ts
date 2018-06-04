import { Component, ViewChild } from '@angular/core';
import { Tabs, Platform, NavController, ToastController, AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { Login } from '../login/login';
import { HomePage } from '../home/home';
import { ReviewsFeed } from '../reviews-feed/reviews-feed';
import { ReviewRequester } from '../review-requester/review-requester';
import { Stats } from '../stats/stats';
import { Support } from '../support/support';

import { AuthService } from '../../providers/auth-service';
import { User } from '../../providers/auth-service';

/**
 * Generated class for the Tabs page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html',
})
export class TabsPage {

	@ViewChild('myTabs') tabRef: Tabs;

	tabHomepage = HomePage;
	tabReviewsFeed = ReviewsFeed;
	tabReviewRequester = ReviewRequester;
	tabSupport = Support;
	tabStats = Stats;

	currentUser: User;
	trial_days_left = null;
	
	cronJobSetUserInfo;

	constructor(public storage: Storage, private auth: AuthService, private platform: Platform, public navCtrl: NavController, public alertCtrl: AlertController, private toastCtrl: ToastController) {		
		this.currentUser = this.auth.getUserInfo();
		platform.ready().then(() => {		
			if (this.currentUser.trial_days_left != 'null') {				
				this.trial_days_left = this.currentUser.trial_days_left;
				this.showToast('Free Trial - ' + this.currentUser.trial_days_left + ' Days Left', 2000);
			}
		});		
  	}

	ionViewWillEnter() {	
		this.storage.get("new_review_id").then(
			(value) => {
				if (value != null && value != "") {
					this.tabRef.select(1);
				}
			}).catch(() => {
			});	

		this.cronJobSetUserInfo = setInterval(() => {
			this.login_check_interval();
		}, 1000 * 3600);
	}

	ionViewDidEnter() {		
	}

	ionViewDidLoad() {
		console.log('ionViewDidLoad Tabs');
	}

	ionViewWillLeave() {
		clearInterval(this.cronJobSetUserInfo);
	}

	public login_check_interval() {		
		this.currentUser = this.auth.getUserInfo();
		this.auth.login(this.currentUser).subscribe(
			allowed => {
				if(allowed) {
					this.currentUser = this.auth.getUserInfo();
					if (this.currentUser.trial_days_left != 'null') {
						if (this.currentUser.trial_days_left != this.trial_days_left) {
							this.trial_days_left = this.currentUser.trial_days_left;
							this.showToast('Free Trial - ' + this.currentUser.trial_days_left + ' Days Left', 2000);
						}
					}					
				} else {
					this.showToast("Your account has expired", 2000);
					this.navCtrl.setRoot(Login, {});
				}
			},
			error => {
				this.exitApp();
			}
		);
	}

	public showToast(text, delay) {
		let toast = this.toastCtrl.create({
			message: text,
			position: 'middle',
			duration: delay
		});
		toast.present();
	}

	public showStatus(text) {
		let alert = this.alertCtrl.create({
			title: 'Status',
			subTitle: text,
			buttons: ['OK']
		});
		alert.present(prompt);
	}

	public exitApp() {
		let confirmAlert = this.alertCtrl.create({
			title: "Something wrong",
			message: "Please check your internet connection",
			buttons: [{
				text: 'OK',
				handler: () => {
					this.platform.exitApp();
				}
			}]
		});
		confirmAlert.present();
	}
}
