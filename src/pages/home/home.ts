import { Component } from '@angular/core';
import { Platform, NavController, ToastController, AlertController, LoadingController, Loading, ModalController, ViewController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { AuthService } from '../../providers/auth-service';
import { User } from '../../providers/auth-service';
import { LocationService } from '../../providers/location-service';
import { Login } from '../login/login';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

	loading: Loading;	
	toReviewsFeed = false;

	currentUser: User;
	locations = [];

	currentLocationID = -1;
	currentLocation = {
		"extendedStats": [],
	};	
	newMessageFound: boolean = false;
	trending_state = 0;

	cronJob: any;

	constructor(public storage: Storage, private platform: Platform, private auth: AuthService, public locationProvider: LocationService, public navCtrl: NavController, private toastCtrl: ToastController, public alertCtrl: AlertController, private loadingCtrl: LoadingController, public modalCtrl: ModalController) {
  	}

	ionViewWillEnter() {
		this.storage.get("new_review_id").then(
			(value) => {
				if (value != null && value != "") {
					this.toReviewsFeed = true;
				} else this.toReviewsFeed = false;
			}).catch(() => {
				this.toReviewsFeed = false;	
			});	

		this.getLocation();

		this.cronJob = setInterval(() => {
			this.getLocation();
		}, 3599 * 1000 - 5);
	}

	ionViewDidEnter() {

	}

	ionViewWillLeave() {
		this.clearAllCronJobs();
	}

	public logout() {
		this.auth.logout().subscribe(
			allowed => {
				this.navCtrl.parent.parent.setRoot(Login);
			},
			error => {
				this.exitApp();
			}
		);		
	}

	public presentDomainModal() {
		let domainModal = this.modalCtrl.create(Domain, {domains: this.currentLocation.extendedStats});
		domainModal.present();
	}

	public getLocationByID() {
		// this.showLoading();
		this.locationProvider.getShow(this.currentLocationID, this.currentUser.token)
			.subscribe(retJson => {
				this.currentLocation = retJson.data.location;
				switch (retJson.data.location.trending) {
					case "Down":
						this.trending_state = -1;
						break;
					case "Up":
						this.trending_state = 1;
						break;
					default:
						this.trending_state = 0;
						break;
				}

				this.newMessageFound = (retJson.data.location.bbb_report != '') ? true : false;

				var now = new Date(),
					year = now.getFullYear(),
					month = now.getMonth() + 1,
					day = now.getDate(),
					date = retJson.data.location.bbb_report.date.split("-");
				if (year > date[0]) {
					month = month + 12
				};
				if (month > date[1]) {
					day = day + 30
				};
				if (day - date[2] > 30 || month - date[1] >= 2) {
					this.newMessageFound = false
				} else {
					this.newMessageFound = true
				}				
			},
			error => {
				this.refreshToken();
			});
	}

	public getLocation() {		
		this.currentUser = this.auth.getUserInfo();
		if( this.currentLocationID == - 1) {
			this.locationProvider.getIndex(this.currentUser.token)
				.subscribe(location => {
					this.locations = location.data;
					this.currentLocationID = location.data[0].id;
					this.getLocationByID();
				},
				error => {
					this.refreshToken();
				});
		} else {
			this.getLocationByID();
		}		
	}

	public refreshToken() {
		this.showToast("token expired, refreshing token", 2000);
		this.auth.login(this.currentUser).subscribe(
			allowed => {
				if (allowed) {
					this.getLocation();
				} else {
					this.showToast("Your account has expired", 2000);
					this.navCtrl.parent.parent.setRoot(Login);
				}
			},
			error => {
				this.exitApp();
			}
		);
	}

	public gotoReviewsFeed() {
		this.navCtrl.parent.select(1);
	}

	public clearAllCronJobs() {
		clearInterval(this.cronJob);
	}

	public exitApp() {
		let confirmAlert = this.alertCtrl.create({
			title: "Something wrong",
			message: "Please check your internet connection",
			buttons: [{
				text: 'OK',
				handler: () => {
					this.clearAllCronJobs();
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

	public showStatus(text) {
		let alert = this.alertCtrl.create({
			title: 'Status',
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




@Component({
	selector: 'page-domain',
	template: `
		<ion-header>
			<ion-navbar color='black'>
				<ion-title>
					<img src="./assets/img/newlogo.jpg">
			  		<ion-buttons right margin-right >
				  		<button ion-button icon-only (click)="dismiss()">
				         	<ion-icon name="md-arrow-dropleft-circle"></ion-icon>
				        </button>	
			      	</ion-buttons>
				</ion-title>		
		  	</ion-navbar>
		</ion-header>

		<ion-content class="background">
			<ion-list>
				<ion-card style="background:rgba(246, 136, 136, 0.3) !important; font-weight:800 !important">
			  		<ion-row>
			  			<ion-col col-6>
			  				Website
			  			</ion-col>
			  			<ion-col col-2 class="rating-col">
			  				Rating
			  			</ion-col>
			  			<ion-col col-4>
			  				Reviews
			  			</ion-col>
			  		</ion-row>
			  	</ion-card>
			  	<ion-card *ngFor = "let domain_info of domains">
			  		<ion-row>
			  			<ion-col col-6>
			  				{{domain_info.domain}}
			  			</ion-col>
			  			<ion-col col-2 class="rating-col">
			  				{{domain_info.rating|number : '1.2-2'}}
			  			</ion-col>
			  			<ion-col col-4>
			  				{{domain_info.total}}
			  			</ion-col>
			  		</ion-row>
			  	</ion-card>
			</ion-list>
		</ion-content>
	`
})
export class Domain {
	domains = [];

	constructor(public viewCtrl: ViewController, params: NavParams) {
		this.domains = params.get('domains');
	}

	public dismiss() {
		this.viewCtrl.dismiss();
	}
}