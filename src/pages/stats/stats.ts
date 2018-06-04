import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Platform, NavController, ToastController, AlertController, LoadingController, Loading } from 'ionic-angular';

import { AuthService } from '../../providers/auth-service';
import { User } from '../../providers/auth-service';
import { LocationService } from '../../providers/location-service';

import { Login } from '../login/login';

/**
 * Generated class for the Stats page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-stats',
  templateUrl: 'stats.html',
})
export class Stats {
	loading: Loading;
	isGenerating = false;

	currentUser: User;
	location = {
		name: "",
		extendedStats: []
	};
	currentLocationID;

	stats_mode = "stats";
	stats_view_mode = "overall";
	chart_overall: any;
	chart_monthly: any;
	chart_website: any;
	chart_ratings: any;

	fromDate: any;
	toDate: any;
	stats_report = [];
	most_popular = [];
	location_name_report;

	constructor(private platform: Platform, private auth: AuthService, public locationProvider: LocationService, public navCtrl: NavController, public alertCtrl: AlertController, private toastCtrl: ToastController, private loadingCtrl: LoadingController, public datepipe: DatePipe) {
  }

  ionViewDidEnter() {
	  this.getLocation();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Stats');
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
			  if (this.stats_mode == "stats")
				  this.change_view_mode();
			  else
				  this.generateReport(false);	  
		  },
		  error => {
			  this.loading.dismiss();
			  this.refreshToken();
		  });
  }

	public change_view_mode() {
		switch (this.stats_view_mode) {
			case "overall":
				this.overallUpdate();
				break;
			case "monthly":
				this.monthlyUpdate();
				break;
			case "website":
				this.websiteUpdate();
				break;
			default:
				this.ratingsUpdate();
				break;
		}
	}

	public generateReport(showWarning = true) {		
		if (this.fromDate == null || this.fromDate == "" || this.toDate == null || this.toDate == "") {
			if (showWarning)
				this.showWarning("Fail", "Please enter all fields");
			return;
		}

		var from_date = new Date(this.fromDate);
		var to_date = new Date(this.toDate);
		if (from_date.getTime() >= to_date.getTime()) {
			if (showWarning)
				this.showWarning("Fail", "Date from must be less to date to");
			return;
		}
		this.isGenerating = true;
		this.showLoading("Please Wait...");

		let from_date_parts = this.fromDate.split('-');
		let to_date_parts = this.toDate.split('-');

		var from_date_inFormat = from_date_parts[1] + '/' + from_date_parts[2] + '/' + from_date_parts[0];
		var to_date_inFormat = to_date_parts[1] + '/' + to_date_parts[2] + '/' + to_date_parts[0];

		this.currentUser = this.auth.getUserInfo();
		this.currentLocationID = this.locationProvider.getLocationID();
		this.locationProvider.getLocationReports(this.currentLocationID, this.currentUser.token, from_date_inFormat, to_date_inFormat)
			.subscribe(retJson => {
				this.stats_report = Object.keys(retJson.stats).map((key) => { return retJson.stats[key] });
				this.most_popular = retJson.most_popular;
				this.location_name_report = retJson.name;
				this.isGenerating = false;
				this.loading.dismiss();
			},
			error => {
				this.isGenerating = false;
				this.loading.dismiss();
				this.refreshToken("generateReport");
			});
	}

	public overallUpdate() {
		this.showLoading("Please Wait...");

		this.currentUser = this.auth.getUserInfo();
		this.currentLocationID = this.locationProvider.getLocationID();

		this.locationProvider.getLocationStats(this.currentLocationID, this.currentUser.token, "overall")
			.subscribe(retJson => {
				this.loading.dismiss();
				var overall_stats = Object.keys(retJson).map((key) => { return retJson[key] });				
				var series = [{
					name: "Overall Rating",
					colorByPoint: true,
					data: [],
				}];
				overall_stats.forEach(function(stat, number) {
					let item = {
						name: stat.domain,
						y: stat.rating
					};
					series[0].data.push(item);
				});

				this.chart_overall = {
					colors: ['#f45b5b', '#8085e9', '#8d4654', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
						'#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
					chart: {
						type: 'column',
						style: {
							fontFamily: 'Signika, serif',
							width: '100%',
							overflow: 'auto'
						}
					},
					title: {
						text: null,
					},
					subtitle: {
						text: this.location.name,
						style: {
							color: 'white',
							fontSize: '1.5rem',
							fontWeight: 'bold'
						}
					},
					xAxis: {
						type: 'category',
						labels: {
							style: {
								color: '#e9e9e9',
								fontSize: '12px'
							}
						},
						gridLineColor: '#D0D0D8',
						uniqueNames: true
					},
					yAxis: {
						title: {
							text: 'Overall Rating',
							style: {
								color: 'white',
								fontSize: '1.2rem',
								fontWeight: '500'
							}
						},
						labels: {
							style: {
								color: '#e9e9e9',
								fontSize: '12px'
							}
						},
						max: 5
					},
					legend: {
						enabled: false
					},
					plotOptions: {
						series: {
							borderWidth: 0,
							shadow: true,
							dataLabels: {
								enabled: true,
								format: '{point.y:.1f}'
							},
							candlestick: {
								lineColor: '#404048'
							},
							map: {
								shadow: true
							}
						}
					},

					tooltip: {
						headerFormat: '<span style="font-size:17px">{series.name}</span><br>',
						pointFormat: '<span style="color:blue; font-size: 17px;">{point.name}</span>: <b>{point.y:.1f}</b><br/>',
						borderWidth: 0,
					},

					series: series,
				}
			}, error => {
					this.loading.dismiss();
					this.refreshToken("overallUpdate");
			});
	}

	public monthlyUpdate () {
		this.showLoading("Please Wait...");

		this.currentUser = this.auth.getUserInfo();
		this.currentLocationID = this.locationProvider.getLocationID();

		this.locationProvider.getLocationStats(this.currentLocationID, this.currentUser.token, "monthly")
			.subscribe(retJson => {
				this.loading.dismiss();
				var monthly_stats = Object.keys(retJson).map((key) => { return retJson[key] });
				var series = [{
					name: "Monthly Distribution",
					colorByPoint: true,
					data: [],
				}];
				monthly_stats.slice().reverse().forEach(function(stat, number) {
					let item = {
						name: stat.month,
						y: stat.quantity
					};
					series[0].data.push(item);
				});
				this.chart_monthly = {
					colors: ['#f45b5b', '#8085e9', '#8d4654', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
						'#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
					chart: {
						type: 'column',
						style: {
							fontFamily: 'Signika, serif',
							width: 'auto',
							overflow: 'auto'
						}
					},
					title: {
						text: null,
					},
					subtitle: {
						text: this.location.name,
						style: {
							color: 'white',
							fontSize: '1.5rem',
							fontWeight: 'bold'
						}
					},
					xAxis: {
						type: 'category',
						labels: {
							style: {
								color: '#e9e9e9',
								fontSize: '12px'
							}
						},
						gridLineColor: '#D0D0D8',
						uniqueNames: true
					},
					yAxis: {
						title: {
							text: 'Monthly Distribution',
							style: {
								color: 'white',
								fontSize: '1.2rem',
								fontWeight: '500'
							}
						},
						labels: {
							style: {
								color: '#e9e9e9',
								fontSize: '12px'
							}
						}
					},
					legend: {
						enabled: false
					},
					plotOptions: {
						series: {
							borderWidth: 0,
							shadow: true,
							dataLabels: {
								enabled: true,
								format: '{point.y}'
							},
							candlestick: {
								lineColor: '#404048'
							},
							map: {
								shadow: true
							}
						}
					},

					tooltip: {
						headerFormat: '<span style="font-size:17px">{series.name}</span><br>',
						pointFormat: '<span style="color:blue; font-size: 17px;">{point.name}</span>: <b>{point.y}</b><br/>',
						borderWidth: 0,
					},

					series: series
				}
			},
			error => {
				this.loading.dismiss();
				this.refreshToken("monthlyUpdate");
			});
	}

	public websiteUpdate() {
		this.showLoading("Please Wait...");

		this.currentUser = this.auth.getUserInfo();
		this.currentLocationID = this.locationProvider.getLocationID();

		this.locationProvider.getLocationStats(this.currentLocationID, this.currentUser.token, "percentage")
			.subscribe(retJson => {
				this.loading.dismiss();

				var website_stats = Object.keys(retJson).map((key) => { return retJson[key] });
				var series = [{
					name: "Website Distribution",
					colorByPoint: true,
					data: [],
				}];				
				website_stats.forEach(function(stat, number) {
					let item = {
						name: stat.domain,
						y: parseFloat(stat.percent) * 1000
					};
					series[0].data.push(item);
				});

				this.chart_website = {
					colors: ['#f45b5b', '#8085e9', '#8d4654', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
						'#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
					chart: {
						backgroundColor: null,
						style: {
							fontFamily: 'Signika, serif'
						},
						plotBackgroundColor: null,
						plotBorderWidth: null,
						plotShadow: false,
						type: 'pie'
					},
					title: {
						text: null,
					},
					subtitle: {
						text: this.location.name,
						style: {
							color: 'white',
							fontSize: '1.5rem',
							fontWeight: 'bold'
						}
					},
					tooltip: {
						headerFormat: '<span style="font-size:17px">{series.name}</span><br>',
						pointFormat: '<span style="color:blue; font-size: 17px;">{point.name}</span>: <b>{point.percentage:.1f}%</b><br/>',
						borderWidth: 0,
					},
					legend: {
						labelFormat: '<b>{name}</b>: {percentage:.1f} %',
						itemStyle: {
							fontSize: '13px',
							color: 'white',
							align: 'right'
						}
					},
					plotOptions: {
						pie: {
							allowPointSelect: true,
							cursor: 'pointer',
							dataLabels: {
								enabled: false,
							},
							showInLegend: true
						},
						series: {
							shadow: true
						},
						candlestick: {
							lineColor: '#404048'
						},
						map: {
							shadow: false
						}
					},
					navigator: {
						xAxis: {
							gridLineColor: '#D0D0D8'
						}
					},
					rangeSelector: {
						buttonTheme: {
							fill: 'white',
							stroke: '#C0C0C8',
							'stroke-width': 1,
							states: {
								select: {
									fill: '#D0D0D8'
								}
							}
						}
					},
					series: series,					
				}
			},
			error => {
				this.loading.dismiss();
				this.refreshToken("websiteUpdate");
			});
	}

	public ratingsUpdate() {
		this.showLoading("Please Wait...");

		this.currentUser = this.auth.getUserInfo();
		this.currentLocationID = this.locationProvider.getLocationID();

		this.locationProvider.getLocationStats(this.currentLocationID, this.currentUser.token, "rank")
			.subscribe(retJson => {
				this.loading.dismiss();

				var ratings_stats = Object.keys(retJson).map((key) => { return retJson[key] });
				var series = [{
					name: "Ratings Distribution",
					colorByPoint: true,
					data: [],
				}];
				ratings_stats.slice().reverse().forEach(function(stat, number) {
					let item = {
						name: stat.rank + " star reviews",
						y: stat.quantity
					};
					series[0].data.push(item);
				});

				this.chart_ratings = {
					colors: ['#f45b5b', '#8085e9', '#8d4654', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
						'#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
					chart: {
						backgroundColor: null,
						style: {
							fontFamily: 'Signika, serif'
						},
						plotBackgroundColor: null,
						plotBorderWidth: null,
						plotShadow: false,
						type: 'pie'
					},
					title: {
						text: null,
					},
					subtitle: {
						text: this.location.name,
						style: {
							color: 'white',
							fontSize: '1.5rem',
							fontWeight: 'bold'
						}
					},
					tooltip: {
						headerFormat: '<span style="font-size:17px">{series.name}</span><br>',
						pointFormat: '<span style="color:blue; font-size: 17px;">{point.name}</span>: <b>{point.percentage:.1f}%</b><br/>',
						borderWidth: 0,
					},
					legend: {
						labelFormat: '<b>{name}:</b> {y} ({percentage:.1f}%)',
						itemStyle: {
							fontSize: '13px',
							color: 'white',
							align: 'right'
						}
					},
					plotOptions: {
						pie: {
							allowPointSelect: true,
							cursor: 'pointer',
							dataLabels: {
								enabled: false,
							},
							showInLegend: true
						},
						series: {
							shadow: true
						},
						candlestick: {
							lineColor: '#404048'
						},
						map: {
							shadow: false
						}
					},
					navigator: {
						xAxis: {
							gridLineColor: '#D0D0D8'
						}
					},
					rangeSelector: {
						buttonTheme: {
							fill: 'white',
							stroke: '#C0C0C8',
							'stroke-width': 1,
							states: {
								select: {
									fill: '#D0D0D8'
								}
							}
						}
					},
					series: series
				}
			},
			error => {
				this.loading.dismiss();
				this.refreshToken("ratingsUpdate");
			});
	}
	public refreshToken(method = "getLocation") {
		this.showToast("token expired, refreshing token", 2000);
		this.auth.login(this.currentUser).subscribe(
			allowed => {
				if (allowed) {
					if (method == "getLocation")
						this.getLocation();
					else if (method == "overallUpdate")
						this.overallUpdate();
					else if (method == "monthlyUpdate")
						this.monthlyUpdate();
					else if (method == "websiteUpdate")
						this.websiteUpdate();
					else if (method == "ratingsUpdate")
						this.ratingsUpdate();
					else if (method == "generateReport")
						this.generateReport();
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

	showLoading(text) {
		this.loading = this.loadingCtrl.create({
			content: text,
			dismissOnPageChange: true
		});
		this.loading.present();
	}
}
