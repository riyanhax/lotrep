import { Component } from '@angular/core';
import { NavController, AlertController, LoadingController, Loading } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { AuthService } from '../../providers/auth-service';
import { TabsPage } from '../tabs/tabs';

/**
 * Generated class for the Login page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class Login {
	loading: Loading;
	credentials = { email: '', password: '' };

	constructor(platform: Platform, private nav: NavController, private auth: AuthService, private alertCtrl: AlertController, private loadingCtrl: LoadingController, public storage: Storage) {

  	}

	public login() {
		this.showLoading();
		this.auth.login(this.credentials).subscribe(
			allowed => {
				if (allowed) {
					this.nav.setRoot(TabsPage, {});
				} else {
					this.showError("Incorrect Login Details");
					this.loading.dismiss();
				}
			},
			error => {
				this.showError(error);
				this.loading.dismiss();
			}
		);
	}

	showLoading() {
		this.loading = this.loadingCtrl.create({
			content: 'Please wait...',
			dismissOnPageChange: true
		});
		this.loading.present();
	}

	showError(text) {
		this.loading.dismiss();

		let alert = this.alertCtrl.create({
			title: 'Fail',
			subTitle: text,
			buttons: ['OK']
		});
		alert.present(prompt);
	}

  	ionViewDidLoad() {
    	console.log('ionViewDidLoad Login');
  	}
}
