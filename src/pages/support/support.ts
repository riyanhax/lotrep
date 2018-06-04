import { Component } from '@angular/core';
import { Platform, NavController, ToastController, AlertController, LoadingController, Loading } from 'ionic-angular';

import { AuthService } from '../../providers/auth-service';
import { User } from '../../providers/auth-service';
import { SupportService } from '../../providers/support-service';

import { Login } from '../login/login';

/**
 * Generated class for the Support page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-support',
  templateUrl: 'support.html',
})
export class Support {
	loading: Loading;

	currentUser: User;
	subject = "";
	message = "";
	isSending = false;

	constructor(private platform: Platform, public navCtrl: NavController, private auth: AuthService, public supportProvider: SupportService, public alertCtrl: AlertController, private toastCtrl: ToastController, private loadingCtrl: LoadingController) {
  	}

  	ionViewWillEnter() {
  	}

  	ionViewWillLeave() {
  	}


  	ionViewDidLoad() {
    	console.log('ionViewDidLoad Support');
  	}


	public sendMessage() {
		if( this.subject == "" || this.message == "") {
			this.showToast("Please input all fields", 2000);
			return;
		}
		this.showLoading();
		this.isSending = true;
		this.currentUser = this.auth.getUserInfo();
		this.supportProvider.sendMessage(this.subject, this.message, this.currentUser.token)
			.subscribe(retJson => {
				this.loading.dismiss();
				this.showToast(retJson.message, 3000);
				this.isSending = false;
			},
			error => {
				this.loading.dismiss();
				this.refreshToken();
			});
	}

	public refreshToken() {
		this.showToast("token expired, refreshing token", 2000);
		this.auth.login(this.currentUser).subscribe(
			allowed => {
				if (allowed) {
					this.sendMessage();
				} else {
					this.navCtrl.parent.parent.setRoot(Login);
				}
			},
			error => {
				this.exitApp();
			}
		);
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

	public showToast(text, delay) {
		let toast = this.toastCtrl.create({
			message: text,
			position: 'middle',
			duration: delay
		});
		toast.present();
	}

	public showWarning(title, text) {
		let alert = this.alertCtrl.create({
			title: title,
			subTitle: text,
			buttons: ['OK']
		});
		alert.present(prompt);
	}

	public showLoading() {
		this.loading = this.loadingCtrl.create({
			content: 'Please wait...',
			dismissOnPageChange: true
		});
		this.loading.present();
	}
}
