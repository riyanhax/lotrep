import { Component } from '@angular/core';
import { Platform, NavController, ToastController, AlertController, LoadingController, Loading } from 'ionic-angular';

import { AuthService } from '../../providers/auth-service';
import { User } from '../../providers/auth-service';
import { RequesterService } from '../../providers/requester-service';

import { Login } from '../login/login';
/**
 * Generated class for the ReviewRequester page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-review-requester',
  templateUrl: 'review-requester.html',
})
export class ReviewRequester {
	loading: Loading;

	currentUser: User;
	request_method = "email";
	recipients = "";
	placeholder = "Please enter recipient email";	
	own_email = "";
	locationID;
	locations = [];
	templateID;
	subject = "";
	templates = [];
	contentLabel = "Content";
	content = "";
	isSending = false;

	constructor(private platform: Platform, private auth: AuthService, public requesterProvider: RequesterService, public navCtrl: NavController, public alertCtrl: AlertController, private toastCtrl: ToastController, private loadingCtrl: LoadingController) {
  	}

 	ionViewWillEnter() {
		this.getLocationsAndTemplates();
  	}

	ionViewWillLeave() {
	}

  	ionViewDidLoad() {
    	console.log('ionViewDidLoad ReviewRequester');
  	}

  	getLocationsAndTemplates() {
		this.showLoading();
		this.currentUser = this.auth.getUserInfo();
		this.requesterProvider.getLocationsAndTemplates(this.request_method, this.currentUser.token)
			.subscribe(retJson => {
				this.locations = retJson.data.locations;
				this.locationID = retJson.data.locations[0].id;
				this.templates = retJson.data.templates;
				let location = this.locations.find(item => item.id == this.locationID);	
				this.templates.forEach(function(template, index) {
					template.subject = template.subject.replace(/<Location Name>/g, location.name);
				});
				this.loading.dismiss();
			},
			error => {
				this.loading.dismiss();
				this.refreshToken();
			});
  	}

	change_request_method () {
		this.content = "";
		this.templateID = -1;
		this.subject = "";
		this.own_email = "";
		this.recipients = "";
		if (this.request_method == "email") {
			this.placeholder = "Please enter recipient emails.";
			this.contentLabel = "Content";
		} else {
			this.placeholder = "Please enter recipient phone numbers.";
			this.contentLabel = "Subject";
		}
		this.getLocationsAndTemplates();
	}

	change_Template() {	
		let location = this.locations.find(item => item.id == this.locationID);	
		let template = this.templates.find(item => item.id == this.templateID);	

		if (this.request_method == "email") {
			this.subject = template.subject.replace(/<Location Name>/g, location.name);
			var contentTemp = template.content.replace(/&lt;Location Name&gt;/g, location.name);
			this.content = contentTemp.replace(/<[^>]*>/g, "");
		} else
			this.content = template.subject.replace(/<Location Name>/g, location.name);
	}

	sendMessage() {
		if (this.request_method == "email") {
			if (this.recipients == "" || this.own_email == "" || this.content == "" || this.subject == "") {
				this.showWarning("Fail", "Please Check Fields");
				return;
			}
		} else {
			if (this.recipients == "" || this.content == "") {
				this.showWarning("Fail", "Please Check Fields");
				return;
			}
		}
		this.showLoading();
		this.isSending = true;

		this.requesterProvider.sendMessage(this.request_method, this.recipients, this.locationID, this.subject, this.content, this.currentUser.token, this.own_email)
			.subscribe(retJson => {
				this.loading.dismiss();
				this.showToast(retJson.message, 3000);
				this.isSending = false;				
			},
			error => {
				this.isSending = false;
				if( error.status == 401) {
					this.loading.dismiss();
					this.refreshToken();
				} else if(error.status == 422) {
					let error_body = JSON.parse(error._body);
					let error_msg = "";
					if (error_body.own_email) {
						error_msg += error_body.own_email[0] + "<br>";
					}
					if (error_body.subject) {
						error_msg += error_body.subject[0];
					}
					this.loading.dismiss();
					if(error_msg == "")
						this.showWarning("Fail", "Please Check Fields");
					else
						this.showWarning("Fail", error_msg);

				} else if(error._body != ""){
					this.loading.dismiss();
					this.showWarning("Fail", "Please input valid recipient email");
				} else {
					this.loading.dismiss();
					this.exitApp();
				}
			});
	}

	public refreshToken() {
		this.showToast("token expired, refreshing token", 2000);
		this.auth.login(this.currentUser).subscribe(
			allowed => {
				if (allowed) {
					this.getLocationsAndTemplates();
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

	showToast(text, delay) {
		let toast = this.toastCtrl.create({
			message: text,
			position: 'middle',
			duration: delay
		});
		toast.present();
	}

	showWarning(title, text) {
		let alert = this.alertCtrl.create({
			title: title,
			subTitle: text,
			buttons: ['OK']
		});
		alert.present(prompt);
	}

	showLoading() {
		this.loading = this.loadingCtrl.create({
			content: 'Please wait...',
			dismissOnPageChange: true
		});
		this.loading.present();
	}
}
