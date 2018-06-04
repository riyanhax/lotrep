import { Component, ViewChild, NgZone } from '@angular/core';
import { Platform, NavController, ToastController, AlertController, LoadingController, Loading, Slides, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { AuthService } from '../../providers/auth-service';
import { User } from '../../providers/auth-service';
import { LocationService } from '../../providers/location-service';
import { FeedService } from '../../providers/feed-service';

import { Login } from '../login/login';
/**
 * Generated class for the ReviewsFeed page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-reviews-feed',
  templateUrl: 'reviews-feed.html',
})
export class ReviewsFeed {

	@ViewChild(Slides) slides: Slides;
	loading: Loading;

	currentUser: User = null;
	location = {};
	currentLocationID = -1;
	feeds = [];

	cur_page_num :number = 1;
	page_count;
	count_per_page = 10;
	
	search_keyword = "";
	source_id = -1;
	rating = -1;

	cur_view_feed_id = -1;
	cur_feed_review = {};
	view_feed = {};

	response_title = "Response";
	response_text = "";
	reason_response = "";

	isReplying = false;

	cronJob: any;

	constructor(private zone: NgZone, public storage: Storage, private platform: Platform, private auth: AuthService, public locationProvider: LocationService, public feedProvider: FeedService, public navCtrl: NavController, private toastCtrl: ToastController, public alertCtrl: AlertController, private loadingCtrl: LoadingController, public events: Events) {
		events.subscribe('functionCall:viewFeed', (review_id) => {
			this.viewFeed(review_id);
		});
  	}

	ionViewWillEnter() {
		if (this.cur_view_feed_id == -1)
			this.slides.lockSwipes(true);

		this.getLocation();		

		this.cronJob = setInterval(() => {
			this.getFeeds();
		}, 3600 * 1000 - 5);

	}

	ionViewWillLeave() {
		this.clearAllCronJobs();
	}

  	ionViewDidLoad() {
    	console.log('ionViewDidLoad ReviewsFeed');
  	}

	public ionSlidePrevEnd(ev) {
		this.slides.lockSwipes(true);
		this.cur_view_feed_id = -1;
	}

	public getLocation() {
		this.showLoading("getting Current Location...");
		this.currentUser = this.auth.getUserInfo();
		this.currentLocationID = this.locationProvider.getLocationID();
		if (this.currentLocationID == -1) {
			this.locationProvider.getIndex(this.currentUser.token)
				.subscribe(location => {
					this.currentLocationID = location.data[0].id;
					this.getLocationByID();
				},
				error => {
					this.loading.dismiss();
					this.refreshToken();
				});
		} else {
			this.getLocationByID();
		}
	}

	public getLocationByID() {
		this.locationProvider.getShow(this.currentLocationID, this.currentUser.token)
			.subscribe(retJson => {
				this.location = retJson.data.location;
				this.loading.dismiss();
				this.getFeeds();
			},
			error => {				
				this.loading.dismiss();
				this.refreshToken();
			});
	}

	public getFeeds(refresh = false) {
		this.showLoading("getting Feeds...");
		this.currentUser = this.auth.getUserInfo();
		if (refresh) {
			this.cur_page_num = 1;
		}
		this.feedProvider.getFeeds(this.currentUser.token, this.cur_page_num, this.count_per_page, this.source_id, this.rating, this.search_keyword, "all")
			.subscribe(retData => {
				this.feeds = retData.data;
				this.page_count = Math.ceil(retData.total / (this.count_per_page * 1.0));
				this.loading.dismiss();
				this.storage.get("new_review_id").then(
					(value) => {						
						if (value != null && value != "") {
							this.viewFeed(value);
							this.storage.set("new_review_id", null);
						}						
					}).catch(() => {
						this.storage.set("new_review_id", null);
					});	
			},
			error => {
				this.loading.dismiss();
				this.refreshToken("getFeeds", refresh);
			});
	}

	public viewFeed(review_id) {
		this.feedProvider.getReviewByID(this.currentUser.token, review_id)
			.subscribe(retData => {				
				this.zone.run(() => {
					this.slides.lockSwipes(false);
					this.cur_view_feed_id = retData.review.id;
					this.cur_feed_review = retData.review;

					this.response_text = "";
					if (!retData.review.response_available) {
						if (retData.review.response != null) {
							this.reason_response = retData.review.response.message;
							this.response_title = "Replied";
						} else {
							this.reason_response = "You can't reply because this post is older than 10 days";
							this.response_title = "Sorry";
						}
					} else this.response_title = "Response";

					this.slides.slideNext();
				});				
			},
			error => {
				this.refreshToken("viewFeed", false, review_id);
			});
	}

	public responseFeed(review_id) {
		if (this.response_text == "") {
			this.showWarning("Fail", "Please input your message");
			return;
		}
		this.showLoading();
		this.isReplying = true;
		var feedOfReviewID = this.feeds.find(item => item.review_id == review_id);
		var now = new Date(),
			year = now.getFullYear(),
			month = now.getMonth() + 1,
			day = now.getDate(),
			date = feedOfReviewID.review_date.split("/");

		if (year > date[2]) month += 12;
		if (month > date[0]) day += 30;
		if (day - date[1] <= 10) {
			this.feedProvider.storeReviewByID(this.currentUser.token, review_id, this.response_text)
				.subscribe(retData => {
					feedOfReviewID.has_response = true,
						feedOfReviewID.response_available = false,
						this.reason_response = this.response_text;
					this.response_title = "Replied";
					this.isReplying = false;
					this.loading.dismiss();
					this.showToast(retData.message, 3000);
				},
				error => {
					this.loading.dismiss();
					this.refreshToken("responseFeed", false, review_id);
					this.isReplying = false;
				});
		} else {
			this.loading.dismiss();
			this.showToast("You can't reply because this post is older than 10 days", 2000);
		}
	}

	public refreshToken(methodType = "getLocation", refresh = false, review_ID = -1) {
		this.showToast("token expired, refreshing token", 2000);
		this.auth.login(this.currentUser).subscribe(
			allowed => {
				if (allowed) {
					if (methodType == "getFeeds")
						this.getFeeds(refresh);						
					else if (methodType == "getLocation") 
						this.getLocation();
					else if (methodType == "viewFeed") 
						this.viewFeed(review_ID);
					else
						this.responseFeed(review_ID);
				} else {
					this.storage.set("new_review_id", null);
					this.showToast("Your account has expired", 2000);
					this.navCtrl.parent.parent.setRoot(Login);
				}
			},
			error => {
				this.storage.set("new_review_id", null);
				this.exitApp();
			}
		);
	}

	public go_to_page(page) {
		if (page < 1) page = 1;
		if (page > this.page_count) page = this.page_count;
		this.cur_page_num = page;

		this.getFeeds();
	}

	public search(ev: any) {
		this.getFeeds();
	}

	public responseFeedUsingPrompt(review_id) {
		let confirmAlert = this.alertCtrl.create({
			title: "Response",
			inputs: [
				{
					name: 'message',
					placeholder: 'Type Your Message'
				}
			],
			buttons: [{
				text: 'Cancel',
				role: 'cancel'
			}, {
				text: 'Send',
				handler: data => {
					this.response_text = data.message;
					this.responseFeed(review_id);
				}
			}]
		});
		confirmAlert.present();		
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

	public showLoading(content = "Please wait...") {
		this.loading = this.loadingCtrl.create({
			content: content,
			dismissOnPageChange: true
		});
		this.loading.present();
	}

	public showWarning(title, text) {
		let alert = this.alertCtrl.create({
			title: title,
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
}
