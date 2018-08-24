import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, ValidatorFn } from '@angular/forms';
import { validator } from "../../providers/validators";

import { Api } from '../../providers/api';
import { cardNumberValidator } from "../../providers/cardNumberValidator";

@Component({
  selector: 'app-account-center',
  templateUrl: './account-center.component.html',
  styleUrls: ['./account-center.component.scss']
})
export class AccountCenterComponent implements OnInit {
  cName: FormControl;
  cNumber: FormControl;
  cardForm: FormGroup;
  expMonth: FormControl;
  cardType: FormControl;
  expYear: FormControl;
  amountValue: FormControl;
  favouriteCheck: FormControl;
  public IsprogressAccountList: boolean = true;
  public IsprogressPaymentList: boolean = true;
  selectedPaymentMethod: number = 0;
  public paymentTypes: any = [];
  public savedAccounts: any = [];
  public nameOnCard: string;

  public cardNumber: string;
  public cvv: string;
  public cardMonth: string;
  public cardYear: string;
  public editNameOnCard: string;
  public editCardNumber: string;
  public editCardMonth: string;
  public editCardYear: string;
  public months: any = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  public years: any = [];
  public form_submited: boolean = false;
  step: any = 0;
  paymentType: any;
  public Isprogress: boolean = false;
  public selectAccount: boolean = false;
  public isAccountSelected: boolean = true;
  public paymentTypeElement: any;
  public paymentTypeSelectName: any = "";
  public IsPaymentTypeSelected: boolean = true;
  public isCardExpire: boolean = false;
  public paymentTypeId: any;
  isAddNewAccountView: boolean = false;
  isEditAccountView: boolean = false;
  cardData: any = {};
  public providerId: any;
  invalidCardNumber: boolean = false;
  cardNumberAlreadyInUse: boolean = false;
  saveLoading: boolean = false;
  AddesSuccesfully: boolean = false;
  updatesSuccesfully: boolean = false;
  deletedSuccesfully: boolean = false;
  isDeleteConfirm: boolean = false;
  isFavourite: boolean = false;
  isAnySavedAccount: boolean = false;
  constructor(private apiService: Api, private formBuilder: FormBuilder, private customValidator: validator, private ref: ChangeDetectorRef) {
    this.cName = new FormControl('', Validators.compose([Validators.required, Validators.pattern('[a-zA-Z ]*')]));
    this.cNumber = new FormControl('', Validators.compose([Validators.required]));
    this.expMonth = new FormControl('', Validators.compose([Validators.required, customValidator.SelectValidation]));
    this.expYear = new FormControl('', Validators.compose([Validators.required, customValidator.SelectValidation]));
    this.cardType = new FormControl(); this.favouriteCheck = new FormControl();
    this.cardForm = this.formBuilder.group({
      'cName': this.cName,
      'cNumber': this.cNumber,
      'expMonth': this.expMonth,
      'expYear': this.expYear,
      'cardType': this.cardType,
      'favouriteCheck': this.favouriteCheck
    }, { validator: cardNumberValidator('cardType', 'cNumber') });
  }
  ngOnInit() {
    let curYear = +(new Date().getFullYear());
    let maxYear = curYear + 13;
    for (var i = curYear; i <= maxYear; i++) {
      this.years.push(i.toString());
    }
    this.listPayementTypes();
  }
  addNewAccount() {
    this.cardForm.reset();
    this.form_submited = false;
    this.isAddNewAccountView = true
    this.isEditAccountView = false
    if (!this.ref["destroyed"])
      this.ref.detectChanges();
  }
  listPayementTypes() {
    this.apiService.listPayementTypes().then(resp => {
      this.paymentTypes = resp["results"];
      this.IsprogressPaymentList = false;
      if (!this.ref["destroyed"])
        this.ref.detectChanges();
      this.listSavedAccounts();
    },
      err => {
        this.IsprogressPaymentList = false;
      }
    );

  }
  addressFormErrors(error: string) {
    return this.cardForm.controls['address'].hasError(error);
  }
  validateCard(event) {
    this.cardNumberAlreadyInUse = false;
    if (this.paymentTypeSelectName) {
      var card_Type: string = this.paymentTypeSelectName;
      var cardNumber: string = event;
      var visaRegEx = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;
      var mastercardRegEx = /^(?:5[1-5][0-9]{14})$/;
      var amexpRegEx = /^(?:3[47][0-9]{13})$/;
      var discovRegEx = /^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;
      if (cardNumber && card_Type) {
        if (card_Type.toLocaleLowerCase() === "visa") {
          if (visaRegEx.test(cardNumber)) {
            return this.invalidCardNumber = false;
          } else {
            return this.invalidCardNumber = true;
          }
        }
        else if (card_Type.toLocaleLowerCase() === "mastercard") {
          if (mastercardRegEx.test(cardNumber)) {
            return this.invalidCardNumber = false;
          } else {
            return this.invalidCardNumber = true;
          }
        } else if (card_Type.toLocaleLowerCase() === "amex") {
          if (amexpRegEx.test(cardNumber)) {
            return this.invalidCardNumber = false;
          } else {
            return this.invalidCardNumber = true;
          }
        } else if (card_Type.toLocaleLowerCase() === "discover") {
          if (discovRegEx.test(cardNumber)) {
            return this.invalidCardNumber = false;
          } else {
            return this.invalidCardNumber = true;
          }
        } else {
          return this.invalidCardNumber = true;
        }
      }
      else {
        return null;
      }
    }
    else {
      this.IsPaymentTypeSelected = false
      this.invalidCardNumber = true;
    }
  }
  selectSavedAccount(account) {
    this.isEditAccountView = true;
    this.isAddNewAccountView = false
    this.IsPaymentTypeSelected = true;
    this.cardForm.reset();
    for (let i = 0; i < this.savedAccounts.length; i++) {
      this.savedAccounts[i]["selected"] = false;
    }
    account.selected = true;
    this.providerId = account.pk
    this.paymentTypeSelectName = account.type_name;
    this.isFavourite = account.favourite == 1 ? true : false;
    this.editNameOnCard = account.name_on_card;
    this.editCardNumber = account.card_number;
    this.editCardMonth = account.expire_month.toString().length == 1 ? "0" + account.expire_month.toString() : account.expire_month.toString();
    this.editCardYear = account.expire_year.toString();
    if (!this.ref["destroyed"])
      this.ref.detectChanges();
  }
  paymentTypeSelect(event, type) {
    this.cardForm.reset();
    this.paymentTypeSelectName = type.type_name;
    this.IsPaymentTypeSelected = true;
    this.paymentTypeId = type.id;
    this.paymentTypeElement = event.currentTarget.parentElement.getElementsByClassName("active");
    this.removeSelctionFromTYpeList();
    event.currentTarget.className = "choose-type active";
    if (!this.ref["destroyed"])
      this.ref.detectChanges();
  }
  removeSelctionFromTYpeList() {
    if (this.paymentTypeElement != undefined) {
      var count = this.paymentTypeElement.length;
      for (var i = 0; i < count; i++) {
        this.paymentTypeElement[i].className = "choose-type";
      }
    }
  }
  cancelClick() {
    this.cardForm.reset();
    this.isAddNewAccountView = false;
    this.isEditAccountView = false;
    this.invalidCardNumber = false; this.cardNumberAlreadyInUse = false;
    this.IsPaymentTypeSelected = false;
    this.paymentTypeSelectName = null; this.form_submited = false;
    if (!this.ref["destroyed"])
      this.ref.detectChanges();
  }
  listSavedAccounts() {
    this.IsprogressPaymentList = true;
    this.IsprogressAccountList = true;
    var cardDigit: string = "";
    var payment_Type: any;
    this.apiService.listSavedAccounts().then(resp => {
      this.savedAccounts = resp["results"];
      for (let i = 0; i < this.savedAccounts.length; i++) {
        payment_Type = this.paymentTypes.filter(
          type => type.id === this.savedAccounts[i]["payment_type"]);
        this.savedAccounts[i]["selected"] = false;
        this.savedAccounts[i]["type_name"] = payment_Type[0].type_name;
        this.savedAccounts[i]["last4"] = this.savedAccounts[i]["card_number"].toString().substring(this.savedAccounts[i]["card_number"].toString().length, this.savedAccounts[i]["card_number"].toString().length - 4);
        this.savedAccounts[i]["payment_type_image"] = payment_Type[0].payment_type_image;
        cardDigit = this.savedAccounts[i]["card_number"] == null ? "" : this.savedAccounts[i]["card_number"];
        this.savedAccounts[i]["last4"] = cardDigit.toString().substring(cardDigit.toString().length, cardDigit.toString().length - 4);
      }
      this.IsprogressPaymentList = false;
      this.IsprogressAccountList = false
      if (resp["count"] == 0) {
        this.isAnySavedAccount = false;
        this.isAddNewAccountView = true
      }
      else
        this.isAnySavedAccount = true
      if (!this.ref["destroyed"])
        this.ref.detectChanges();
    },
      err => {
        if (!this.savedAccounts || this.savedAccounts == 0) {
          this.isAddNewAccountView = true
        }
        this.IsprogressPaymentList = false;
        this.IsprogressAccountList = false;
        if (!this.ref["destroyed"])
          this.ref.detectChanges();
      }
    );
  }
  setStep(index: number) {
    this.step = index;
  }
  nextStep() {
    this.step++;
  }
  prevStep() {
    this.step--;
  }
  cardSubmit() {
    this.cardNumberAlreadyInUse = false;
    this.form_submited = true;
    if (this.cardForm.valid && !this.invalidCardNumber && this.cardForm.dirty && this.paymentTypeSelectName && !this.isCardExpire) {
      this.saveLoading = true;
      if (this.isFavourite)
        this.cardData['favourite'] = 1;
      else
        this.cardData['favourite'] = 0;
      this.cardData['name_on_card'] = this.nameOnCard;
      this.cardData['card_number'] = this.cardNumber;
      this.cardData['payment_type'] = this.paymentTypeId;
      this.cardData['expire_month'] = this.cardMonth;
      this.cardData['expire_year'] = this.cardYear;
      this.apiService.saveProvider(this.cardData).then(resp => {
        this.saveLoading = false;
        this.IsprogressPaymentList = true;
        this.IsprogressAccountList = true;
        this.listPayementTypes();
        this.AddesSuccesfully = true;
        setTimeout(() => {
          this.AddesSuccesfully = false;
          if (!this.ref["destroyed"])
            this.ref.detectChanges();
        }, 5000);
        if (!this.ref["destroyed"])
          this.ref.detectChanges();
        this.cancelClick()
      },
        err => {
          this.AddesSuccesfully = false;
          this.saveLoading = false;
          if (err.card_number) {
            this.cardNumberAlreadyInUse = true;
          }
          else
            this.cardNumberAlreadyInUse = false;
          if (!this.ref["destroyed"])
            this.ref.detectChanges();
        }
      );
    }
  }
  cardEdit() {
    this.form_submited = true;
    this.cardNumberAlreadyInUse = false;
    if (this.cardForm.valid && !this.invalidCardNumber && this.cardForm.dirty && this.paymentTypeSelectName && !this.isCardExpire && this.providerId) {
      this.saveLoading = true;
      if (this.isFavourite)
        this.cardData['favourite'] = 1;
      else
        this.cardData['favourite'] = 0;
      this.cardData['name_on_card'] = this.editNameOnCard;
      this.cardData['card_number'] = this.editCardNumber;
      this.cardData['payment_type'] = this.paymentTypeId;
      this.cardData['expire_month'] = this.editCardMonth;
      this.cardData['expire_year'] = this.editCardYear;
      this.apiService.updateProvider(this.cardData, this.providerId).then(resp => {
        this.saveLoading = false;
        this.IsprogressPaymentList = true;
        this.IsprogressAccountList = true;
        this.updatesSuccesfully = true;
        this.cancelClick()
        this.cardForm.reset();
        this.listPayementTypes();
        setTimeout(() => {
          this.updatesSuccesfully = false;
          if (!this.ref["destroyed"])
            this.ref.detectChanges();
        }, 5000);
        if (!this.ref["destroyed"])
          this.ref.detectChanges();
      },
        err => {

          this.saveLoading = false;
          this.updatesSuccesfully = false;
          if (err.card_number) {
            this.cardNumberAlreadyInUse = true;
          }
          else
            this.cardNumberAlreadyInUse = false;
          if (!this.ref["destroyed"])
            this.ref.detectChanges();
        }
      );
    }
  }
  cardDelete(id) {
    this.providerId = id;
    if (this.providerId) {
      this.apiService.deleteProvider(this.providerId).then(resp => {
        this.isDeleteConfirm = false;
        this.IsprogressPaymentList = true;
        this.IsprogressAccountList = true;
        this.deletedSuccesfully = true;
        setTimeout(() => {
          this.deletedSuccesfully = false;
          if (!this.ref["destroyed"])
            this.ref.detectChanges();
        }, 5000);
        this.listPayementTypes();
      },
        err => {
          this.deletedSuccesfully = false;
          this.isDeleteConfirm = false;
        }
      );
    }
  }
  change() {
    var dateNow = new Date();
    if (this.cardYear && this.cardMonth) {
      if (+this.cardYear == dateNow.getFullYear()) {
        if (+this.cardMonth > dateNow.getMonth()) {
          this.isCardExpire = false;
        }
        else
          this.isCardExpire = true;
      } else {
        this.isCardExpire = false;
      }
    }
  }
}
