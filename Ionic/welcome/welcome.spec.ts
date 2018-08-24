import { async, TestBed } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import {} from 'jasmine';
import { Welcome } from './welcome';
import {  NavController, ViewController, NavParams, Platform  } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';
import { BrowserModule } from '@angular/platform-browser';
import { Http } from '@angular/http';
import { Helper } from '../../providers/utilities/helper/helper';
import { Settings } from '../../providers/utilities/app-settings';
import { HttpModule } from '@angular/http';
import {ViewControllerMock, HelperMock, NavParamsMock} from "../../mocks/generalmock";


describe('Welcome Component', () => {
  let fixture;
  let component;
  
  beforeEach(async(() => {
    Settings.run = "test";
    TestBed.configureTestingModule({
      declarations: [Welcome],
      imports: [
        IonicModule.forRoot(Welcome),HttpModule, BrowserModule
              ],
      providers: [
       NavController,
        { provide: ViewController, useClass: ViewControllerMock },
        { provide: Settings, useClass: Settings },
        

         { provide: Helper, useClass: HelperMock },
         { provide: NavParams, useClass: NavParamsMock },
     
     
    
       
      ]
    })
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Welcome);
    component = fixture.componentInstance;
    component.helper = new HelperMock();

  });

  it('Welcome component should be created', () => {
      
      expect(component instanceof Welcome).toBe(true);

  });

  it('zero pad test', () => {
      var zero_pad = component.zeroPad(1, 3);
      expect(zero_pad).toBe("001");

  });

 it('counter test', () => {
      var result = component.countDownTimer(100);
      expect(result).toBe("01:40");
  });

 it('counter test negative time', () => {
   component.setSlidesCount();
   expect(component.featuredGames.slidesPerView).toBe(1);
 });







});