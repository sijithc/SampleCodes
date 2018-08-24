import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, ViewController, NavParams, Platform  } from 'ionic-angular';

import { Http } from '@angular/http';
import { Settings } from '../../providers/utilities/app-settings';
import { Helper } from '../../providers/utilities/helper/helper';
import * as moment from 'moment/moment';
import { Observable, Subscription } from 'rxjs/Rx';



@IonicPage()
@Component({
	selector: 'page-welcome',
	templateUrl: 'welcome.html',
	providers: [Helper]
})
export class Welcome {
	public currentTime;
	@ViewChild('featuredGames') featuredGames: any;
	featured_games_slides: Array<Object> = [];
	hide_popup: boolean = false;
	private future: Date;
	private countString: string;
	private diff: number;
	private $counter: Observable<number>;
	private subscription: Subscription;
	private deactivated: boolean;
	public clickControl=false;
	amount: number = 0;
	

constructor(
	public navCtrl: NavController,
	public viewCtrl: ViewController,
	public platform: Platform,
	public http: Http,
	public helper: Helper
	
	

) {	

   

this.initWelcome()    
    
	
}


initWelcome(){

	   this.countString = Settings.lockTime.toString() + ":00";
	   this.future = new Date();
	   this.$counter = Observable.interval(500).map((x) => {
	   this.diff = -(Math.floor((this.future.getTime() - new Date().getTime()) / 1000));
	   return x;
	   });
	   this.subscription = this.$counter.subscribe((x) => this.countString = this.countDownTimer(this.diff));

	   if(Settings.run == "test"){
           return true;
       }
	   /*var self = this;
	    document.addEventListener('webkitfullscreenchange', function() {
	       if (!document.webkitIsFullScreen ){
				self.helper.goToStandBy();
			}			
		}, false);
	    
	    document.addEventListener('mozfullscreenchange', function() {
	       if (!document.mozFullScreenElement ){
				self.helper.goToStandBy();
			}	
		}, false);*/
		


		this.currentTime =  moment().format('hh : mm a');

		setInterval(() => {
			this.currentTime =  moment().format('hh : mm a');
		}, 1000);

	    this.helper.setLoading();
		this.http.get(Settings.apiEndpoint+'featuredgames.json')
		.map(res => res.json()).subscribe(
				data => {
					
					this.setWalletMoney();
					this.featured_games_slides = data;
					this.helper.removeLoading();
					this.setSlidesCount();
			    },

			    err=>{
			    	this.helper.removeLoading();
			    }

	    );

					   
}




   public  zeroPad(num, places): string {
      var zero = places - num.toString().length + 1;
      return Array(+(zero > 0 && zero)).join("0") + num;
   }

 setWalletMoney(){
       this.http.get(Settings.apiEndpoint + 'wallets.json').map(res => res.json()).subscribe(
	      data => {
			    
	       for (let i = 0; i < data.length; i++) { 
	           if(data[i].status == "won"){
	             this.amount = this.amount + data[i].amount;
	           }
	           else{
	             this.amount = this.amount - data[i].amount;
	           }
	       }	
	    }
	     );
	  }


countDownTimer(t) {
        var  minutes, seconds;
        minutes = Math.floor(t / 60) % 60;
        t -= minutes * 60;
        seconds = t % 60; 
        if(seconds <= 0 && minutes <= 0) {
        	
            this.subscription.unsubscribe();
            this.deactivated = true;
            this.helper.goToStandBy();

        }

        seconds = this.zeroPad(seconds,2);
        minutes = this.zeroPad(minutes, 2);
        return [
            minutes + ':',
            seconds + ''
        ].join('');
   }



   	setSlidesCount(): void {
        var width = this.platform.width();
   	    if(width <= 460){
	       this.featuredGames.slidesPerView = 1;
	    }
        else if(width <= 768){
           this.featuredGames.slidesPerView = 3;
        }
        else if(width < 1060){
           this.featuredGames.slidesPerView = 4;
        }
        else{
           this.featuredGames.slidesPerView = 6;
		}
	}
       

	    ionViewWillEnter(): void {
		   	
		   	var self = this;
			window.addEventListener('resize', function() { self.setSlidesCount(); }, true);

		   	
	    }
	    


	gotoPlay(url):void {
		this.clickControl=true;
		this.navCtrl.push('Game', {param1: url}, {animate:  true, animation: "ios-transition", direction : 'right'})
		.then(() => {
	          this.clickControl=false;
	    });
	}

	gotoGameList():void {
		this.clickControl=true;
		this.navCtrl.push('Gamelist', {}, {animate:  true, animation: "ios-transition", direction : 'right'})
		.then(() => {
	          this.clickControl=false;
	    });
	}

	gotoLock(){
		this.clickControl=true;
		this.navCtrl.push('LockScreen', {}, {animate:  true, animation: "ios-transition", direction : 'back'})
		.then(() => {
	        this.clickControl=false;
	    });
	}

	gotoWallet(){
		this.clickControl=true;
		this.navCtrl.push('Wallet', {}, {animate:  true, animation: "ios-transition", direction : 'right'})
		.then(() => {
	          this.clickControl=false;
	    });
	}

    nextSlide(): void {
		this.featuredGames.slideNext();
	}

	prevSlide(): void {
		this.featuredGames.slidePrev();

	}
}
