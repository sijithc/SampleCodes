'use strict';

class Config {

    constructor() {

        const loginUrl = (() => {
            const mockBaseUrl = process.env.MOCK_BASE_URL || 'http://mocksite.manibus.pw';
            return (process.env.IS_MOCK_MODE === 'true') ?
                `${mockBaseUrl}/#`
                : "https://ibank.klikbca.com/";
        })();


        const logOutUrl = (() => {
            const mockBaseUrl = process.env.MOCK_BASE_URL || 'http://mocksite.manibus.pw';
            return (process.env.IS_MOCK_MODE === 'true') ?
                `${mockBaseUrl}/#`
                : "https://ibank.klikbca.com/authentication.do?value(actions)=logout";
        })();

        this.config = {
            "bankCode": "BCA",
            'bankLogin': loginUrl,
            'logoutUrl': logOutUrl,
            "minTransferAmt": "10000",
            "inputTypeDelay": 100, // 100 milliseconds
            "pageWaitDelay": 3000, // 3 seconds
            "pageNavigationTimeout": 60000, // 1 minute,
            "dispatcherTimeout": 60000 // 1 minute
        };
        this.selectors = {
            "login": {
                "usernameInput": "input#user_id",
                "passwordInput": "input#pswd",
                "loginSubmitBtn": "input[name='value(Submit)']"
            },
            "dashboard": {
                "fundtransferBtn": "a[href='fund_transfer_menu.htm']",
                "accountInfoBtn": "a[href='account_information_menu.htm']",
                "backBtn": "a[href='menu_bar.jsp']"
            },
            "account": {
                "accountBalanceBtn": "body > div.submenu.active > div:nth-child(2) > a",    //"//a[contains(text(), 'Account Balance')]",  //  ,
                "accountNumber": "#Any_0 > td:nth-child(1)",
				"accountBalance": "#Any_0 > td:nth-child(5)",
				"accountList":"body > table:nth-child(3) > tbody > tr:nth-child(n+2) "
			},            
            "balanceInquiry": {
                "balanceBtn": "body > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(4) > td > table > tbody > tr:first-child > td:nth-child(2) > font > a",
                "balance":"body > table:nth-child(3) > tbody > tr:nth-child(2) > td:nth-child(4) > div",
                "accountNumber":"body > table:nth-child(3) > tbody > tr:nth-child(2) > td:nth-child(1) > div",
            },
            "fundTransfer": {
                "registerBtn": "body > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > font > a",
                "transferIntraExisting": "body > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(4) > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > font > a",
                "transferList":"#acc_to3",
                "chooseMyListOption":"input#R1:not(:checked)",
                "selectOwnAccount":"input[value='BCA']",
                "sendBtn":"input[value='Send']",
                "destinationAccountInput":"input[id='rekeningnya']",
                "appli2Input":"input[id='tantangan']",
                "continue":"input[value='Continue']",
                "submit":"input[value='Submit']",
                "addedAccountSelect":"#acc_to3",
                "amountInput":"input[name='value(amount)']",
                "remarkInput":"input[name='value(remarkLine1)']",
                "keyBCA":"input[name='value(keyBCA)']",
                "appliOneInput":"input[name='value(respondAppli1)']",
                "referenceNumberSelector":"body > table:nth-child(3) > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(3) > font",
                "transactionDateSelector":"body > table:nth-child(3) > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(3) > font",
                "transactionTimeSelector":"body > table:nth-child(3) > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr:nth-child(2) > td:nth-child(3) > font",
                "theChallengeText":"#theChallenge",
                "rndNum":"#rndNum",
                "tokenError":"body > form > table:nth-child(8) > tbody > tr:nth-child(12) > td > div > font > b"
            }
        }


    }



    get(key) {
        if (this.config.hasOwnProperty(key)) {
            return this.config[key];
        } else {
            console.log(`Invalid configuration - ${key}`);
        }
    }


}

module.exports = Config;
