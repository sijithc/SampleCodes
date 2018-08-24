'use strict';

const accounting = require('accounting');
const fs = require('fs-extra');

const puppeteer = require('puppeteer');
const CaptchaService = require('../../../Gepetto/Captcha/CaptchaService');

/**
 * Bank Robot
 */
class Robot {

    constructor(mode) {
        if (typeof mode !== 'undefined') {
            this.mode = mode;
        } else {
            this.mode = 'local';
        }
        this.initialize()
    }

    initialize() {
        if (this.mode === 'server') {
            let Config = require('./server');
            this.config = new Config();
        } else {
            let Config = require('./local');
            this.config = new Config();
        }
        this.captchaService = new CaptchaService();
    }

    async takeScreenshot() {
        this.screenshotBuffer = await this.page.screenshot({
            fullPage: true
        });
        this.screenshotData = {
            "path": this.screenshotPath,
            screenshot: this.screenshotBuffer
        };
        await this.screenshot.saveScreenshot(this.screenshotData, this.message)
    }

    set message(message) {
        this._message = message
    }
    get message() {
        return this._message;
    }

    /**
     * Remove new line, tab and white space from a html code.
     * @param html
     * @returns {*|string|void}
     */
    stripHtml(html) {
        return html.replace(/\n+\t+\s+/gm, '');
    }

    /**
     * Starting robot
     * @returns {Promise<void>}
     */
    async start() {
        this.screenshotPath = this.mediaPath + "/" + this.config.get('bankCode') + '/screenshots/' + this.message.transactionId;
        fs.ensureDirSync(this.screenshotPath);
        this.selectors = this.config.selectors;
        this.LOGGER_PREFIX = `${this.message.bank} TXN:${this.message.transactionId} `;
        if (!this.session) {
            this.page = await this.browser.newPage();
            await this.login();
        } else {
            this.session = {
                'bank': this.message.bank,
                'transactionId': this.message.transactionId
            }
            await this.page.waitFor(this.config.get('pageWaitDelay'));
            if (await this.page.$(this.selectors.login.usernameInput) != null && await this.page.$(this.selectors.login.usernameInput) != "")
            {
                await this.login();
            }
                
        }

        await this.minAmountValidation();
        await this.processTransaction();
    }



    /**
     * Send error report to the dispatcher
     * @param message
     * @param status
     * @returns {Promise<boolean>}
     */
    async sendError(message, status) {
        if (this.mode !== 'server') {
            return false;
        }
        let errorMessage = {
            "Account": this.message.account,
            "Source": this.message.source,
            "Bank": this.message.bank,
            "Currency": this.message.currency,
            "TransactionId": this.message.transactionId,
            "Command": "Error",
            "Message": {
                "Text": message,
                "Status_Id": status

            }
        };
        this.dispatcher.reportError(errorMessage, status)
    }




    /**
     * Fetch current DOM content and save it as a html file
     * @returns {Promise<void>}
     */
    async sendHtmlLog() {
        this.bodyHtml = await this.page.evaluate(() => document.body.innerHTML);
        this.htmlData = {
            "path": this.screenshotPath,
            html: this.bodyHtml
        };
        await this.htmlLog.saveHtml(this.htmlData, this.message);
    }

    /**
     *
     * @returns {Promise<void>}
     */

    async minAmountValidation() {
        this.logger.info(`${this.LOGGER_PREFIX}  Validating minimum transaction amount`);
        if (accounting.unformat(this.message.message.amount) < this.config.get('minTransferAmt')) {

            let errorMessage = `${this.LOGGER_PREFIX} MINAMOUNT::VALIDATION:: Transaction amount is less than minimum transaction amount`;
            this.logger.error(errorMessage);
            this.sendError(errorMessage, this.lib.errorCodes.UNEXPECTED_ERROR_607);
            await this.sendHtmlLog();
            throw errorMessage;
        }
    }

    async login() {
        this.logger.info(`${this.LOGGER_PREFIX}  Login started`);
        await this.page.goto(this.config.get('bankLogin'), {
            waitUntil: 'networkidle2',
            timeout: this.config.get('pageNavigationTimeout')
        });

        this.loginError = false;
        await this.page.on('dialog', async dialog => {
            await dialog.accept();
            this.loginError = true;
        });


        const usernameEle = await this.page.$(this.selectors.login.usernameInput);
        await usernameEle.type(this.message.message.source.username, {
            'delay': this.config.get('inputTypeDelay')
        });
        const passwordEle = await this.page.$(this.selectors.login.passwordInput);
        await passwordEle.type(this.message.message.source.password, {
            'delay': this.config.get('inputTypeDelay')
        });
        this.takeScreenshot();
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        const loginSubmitBtn = await this.page.$(this.selectors.login.loginSubmitBtn);
        await loginSubmitBtn.click();
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        if (this.loginError) {
            await this.showUserError()
            this.takeScreenshot();
        }
        this.loggedIn = true;
        this.session = {
            'transactionId': this.message.transactionId,
        }
        this.logger.info(`${this.LOGGER_PREFIX}  Login Success`);

    }


    async showUserError() {
        let errMessage = `${this.LOGGER_PREFIX} LOGIN::User ID / Password does not match`;
        this.logger.error(errMessage);
        this.sendError(errMessage, this.lib.errorCodes.INVALID_ACCOUNT_402);
        throw `${errMessage}`;
    }

    async getFrame(name) {
        let frames = await this.page.frames();
        let contentFrame = frames.find(f => f.name() === name);

        let retry = 0;
        while (retry < 3 && typeof contentFrame === 'undefined') {
            frames = await this.page.frames();
            contentFrame = frames.find(f => f.name() === name);
            this.logger.info(`${this.LOGGER_PREFIX} INFO::Retrying for frame:${name}`);
            retry++;
        }
        if (typeof contentFrame !== 'undefined') {
            await contentFrame.evaluate(() => {
                if (!window.Node) {
                    window.Node = {};
                }
                if (!Node.ELEMENT_NODE) {
                    Node.ELEMENT_NODE = 1;
                }
            });
            return contentFrame;
        } else {
            let errMessage = `${this.LOGGER_PREFIX} VALIDATION::ERROR - Unable to fetch frame:${name}`;
            this.logger.error(errMessage);
            this.sendError(errMessage,
                this.lib.errorCodes.ELEMENT_NOT_FOUND_204);
            throw errMessage;
        }
    }

    async gotoFirstLink() {
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        const contentFrame = await this.getFrame('menu');
        await contentFrame.waitForSelector(this.selectors.balanceInquiry.balanceBtn, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const balanceInquiry = await contentFrame.$(this.selectors.balanceInquiry.balanceBtn);
        contentFrame.evaluate(e => e.click(), balanceInquiry);
        this.takeScreenshot();
    }

    async validateAccount() {
        this.logger.info(`${this.LOGGER_PREFIX}  Account validation started`);
        await this.page.waitFor(this.config.get('pageWaitDelay'));

        const AccountContentFrame = await this.getFrame('atm');
        await AccountContentFrame.waitForSelector(this.selectors.account.accountList, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        let accountElementList = await AccountContentFrame.$$(this.selectors.account.accountList);
        let accounts = {};
        let AccNo = 0;
        let balanceAmount = 0;

        for (let ele in accountElementList) {
            if (typeof ele !== 'undefined') {
                let accountHandler = await accountElementList[ele].$('td:nth-child(1) > div > font');
                let accountNumber = this.lib.stripHtml(await AccountContentFrame
                    .evaluate(el => el.textContent, accountHandler));
                AccNo = accounting.unformat(this.stripHtml(accountNumber), '.');
                let accountBalanceHandler = await accountElementList[ele]
                    .$('td:nth-child(4) > div > font');
                let accountBalance = this.lib.stripHtml(await AccountContentFrame
                    .evaluate(el => el.textContent, accountBalanceHandler));
                accounts[accountNumber] = accounting.unformat(accountBalance, ",");
                balanceAmount = accounting.unformat(this.stripHtml(accountBalance), '.');
                accounts[AccNo] = accounting.unformat(balanceAmount, ",");
            }
        }
        if (!accounts.hasOwnProperty(this.message.message.source.accountNumber)) {
            let errorMessage = `${this.LOGGER_PREFIX} ACCOUNT::VALIDATION:: Missing source account
            Source AccountNumber: ${this.message.message.source.accountNumber}`;
            this.sendError(errorMessage, this.lib.errorCodes.INVALID_ACCOUNT_402);
            await this.sendHtmlLog();
            throw errorMessage;
        }

        if (!this.lib.checkAccountBalance(accounts[this.message.message.source.accountNumber], this.message.message.amount)) {
            let errorMessage = `${this.LOGGER_PREFIX} BALANCE::VALIDATION Insufficient balance
            Available Balance: ${accounts[this.message.message.source.accountNumber]}
            Transaction Amount: ${this.message.message.amount}`;
            this.sendError(errorMessage, this.lib.errorCodes.INSUFFICIENT_BALANCE_501);
            await this.sendHtmlLog();
            throw errorMessage;
        }
        this.logger.info(`${this.LOGGER_PREFIX}  Account has been validated`);
    }


    async processTransaction() {

        await this.page.waitFor(this.config.get('pageWaitDelay'));
        const contentFrame = await this.getFrame('menu');
        await contentFrame.waitForSelector(this.selectors.dashboard.accountInfoBtn, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const accountInfo = await contentFrame.$(this.selectors.dashboard.accountInfoBtn);
        await accountInfo.click();
        await this.gotoFirstLink();
        const functionFrame = await this.getFrame('atm');
        await functionFrame.waitForSelector(this.selectors.balanceInquiry.balance, {
            timeout: this.config.get('pageNavigationTimeout')
        });

        await this.validateAccount();

        await this.goBack();
        await this.transfer();
        await this.gotoFirstLink();
        await this.checkBeneficiary();

    }


    async checkBeneficiary() {
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        const contentFrame = await this.getFrame('menu');
        await contentFrame.waitForSelector(this.selectors.fundTransfer.transferIntraExisting, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const checkBeneficiaryAvailability = await contentFrame.$(this.selectors.fundTransfer.transferIntraExisting);
        contentFrame.evaluate(e => e.click(), checkBeneficiaryAvailability);
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        const functionFrame = await this.getFrame('atm');
        await functionFrame.waitForSelector(this.selectors.fundTransfer.chooseMyListOption, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const chooseMylistRadioBtn = await functionFrame.$(this.selectors.fundTransfer.chooseMyListOption);
        await functionFrame.click(this.selectors.fundTransfer.chooseMyListOption);
        this.takeScreenshot();
        await this.isBeneficiaryExist();
    }


    async isBeneficiaryExist() {
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        const functionFrame = await this.getFrame('atm');
        await functionFrame.$('#acc_to3');
        await this.page.waitFor(1000)
        let accountSelect = await functionFrame.evaluate((message) => {
            let el = document.querySelectorAll('#acc_to3')[0];
            for (var i = 0; i < el.options.length; i++) {
                if (el.options[i].value == message.message.beneficiary.accountNumber) {
                    el.selectedIndex = i;
                    var event = new Event('change');
                    el.dispatchEvent(event);
                    return Promise.resolve(true);
                }
            }
            return Promise.resolve(false);

        }, this.message);
        if (!accountSelect) {

            this.logger.info(`${this.LOGGER_PREFIX} failed to select account`);
            if (!this.beneficiaryTried) {
                this.logger.info(`${this.LOGGER_PREFIX} trying to add beneficiary`);
               // await this.registerDestinationAccount()
                this.beneficiaryTried = true;
            }
        } else {
           // await this.startFundTransfer();
        }


    }

    async registerDestinationAccount() {
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await this.gotoFirstLink();
        this.takeScreenshot();
        const functionFrame = await this.getFrame('atm');
        await functionFrame.waitForSelector(this.selectors.fundTransfer.selectOwnAccount, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const chooseOwnBank = await functionFrame.$(this.selectors.fundTransfer.selectOwnAccount);
        functionFrame.evaluate(e => e.click(), chooseOwnBank);
        this.takeScreenshot();
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await functionFrame.waitForSelector(this.selectors.fundTransfer.sendBtn, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const sendButton = await functionFrame.$(this.selectors.fundTransfer.sendBtn);
        functionFrame.evaluate(e => e.click(), sendButton);
        this.takeScreenshot();
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await functionFrame.waitForSelector(this.selectors.fundTransfer.destinationAccountInput, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const destAccountInput = await functionFrame.$(this.selectors.fundTransfer.destinationAccountInput);
        await destAccountInput.type(this.message.message.beneficiary.accountNumber, {
            'delay': this.config.get('inputTypeDelay')
        });

        await this.page.waitFor(this.config.get('pageWaitDelay'));
        let mPinRegRequestPayload = {
            "Account": this.message.account,
            "Source": this.message.source,
            "Bank": this.message.bank,
            "Currency": this.message.currency,
            "TransactionId": this.message.transactionId,
            "Type": this.message.type,
            "Reply-Queue": this.message['reply-Queue'],
            "Command": "RequestManualInput",
            "Message": {
                "RequestType": "TOKEN",
                "Text": 'Please enter the token code on token input'
            }
        };
        const mPin = await this.tokenService.getToken(mPinRegRequestPayload);

        await functionFrame.waitForSelector(this.selectors.fundTransfer.appli2Input, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const appli2InputText = await functionFrame.$(this.selectors.fundTransfer.appli2Input);
        await appli2InputText.type(mPin.token, {
            'delay': this.config.get('inputTypeDelay')
        });

        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await functionFrame.waitForSelector(this.selectors.fundTransfer.continue, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const continueButton = await functionFrame.$(this.selectors.fundTransfer.continue);
        functionFrame.evaluate(e => e.click(), continueButton);
        this.takeScreenshot();
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await functionFrame.waitForSelector(this.selectors.fundTransfer.sendBtn, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const sendButton = await functionFrame.$(this.selectors.fundTransfer.sendBtn);
        functionFrame.evaluate(e => e.click(), sendButton);
        this.takeScreenshot();
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await this.startFundTransfer();

    }

    async goBack() {
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        const contentFrame = await this.getFrame('menu');
        await contentFrame.waitForSelector(this.selectors.dashboard.backBtn, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const backButton = await contentFrame.$(this.selectors.dashboard.backBtn);
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await backButton.click();
    }

    async transfer() {
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        const contentFrame = await this.getFrame('menu');
        await contentFrame.waitForSelector(this.selectors.dashboard.fundtransferBtn, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const transferBtn = await contentFrame.$(this.selectors.dashboard.fundtransferBtn);
        await transferBtn.click();
        await this.takeScreenshot();
    }

    async startFundTransfer() {
        this.logger.info(`${this.LOGGER_PREFIX}  Fund transfer started`);
        await this.page.waitFor(this.config.get('pageWaitDelay'));

        const functionFrame = await this.getFrame('atm');
        await functionFrame.waitForSelector(this.selectors.fundTransfer.amountInput, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const fundInput = await functionFrame.$(this.selectors.fundTransfer.amountInput);
        await fundInput.type(this.message.message.amount, {
            'delay': this.config.get('inputTypeDelay')
        });

        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await functionFrame.waitForSelector(this.selectors.fundTransfer.remarkInput, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const remarkInputText = await functionFrame.$(this.selectors.fundTransfer.remarkInput);
        await remarkInputText.type(this.message.transactionId, {
            'delay': this.config.get('inputTypeDelay')
        });
        await this.page.waitFor(this.config.get('pageWaitDelay'));

        await this.page.waitFor(this.config.get('pageWaitDelay'));
        let keybcaCalcOne = '';
        try {
            await this.page.waitFor(this.config.get('pageWaitDelay'));
            await functionFrame.waitForSelector(this.selectors.fundTransfer.rndNum, {
                timeout: this.config.get('pageNavigationTimeout')
            });

            keybcaCalcOne = await functionFrame.evaluate((selector) => {
                return document.querySelector(selector).value;
            }, this.selectors.fundTransfer.rndNum);
        } catch (error) {
            this.logger.error(`${this.LOGGER_PREFIX} TRANSACTION::TOKEN: Unable to get token reference number`)
        }

        let keybcaCalcTwo = '';
        try {
            await this.page.waitFor(this.config.get('pageWaitDelay'));
            await functionFrame.waitForSelector(this.selectors.fundTransfer.theChallengeText, {
                timeout: this.config.get('pageNavigationTimeout')
            });

            keybcaCalcTwo = await functionFrame.evaluate((selector) => {
                return document.querySelector(selector).value;
            }, this.selectors.fundTransfer.theChallengeText);
        } catch (error) {
            this.logger.error(`${this.LOGGER_PREFIX} TRANSACTION::TOKEN: Unable to get token reference number`)
        }


        let referenceNumForToken = "";
        if (keybcaCalcTwo && keybcaCalcOne) {
            referenceNumForToken = this.lib.stripHtml(keybcaCalcOne + keybcaCalcTwo);
        }

        let mPinRequestPayload = {
            "Account": this.message.account,
            "Source": this.message.source,
            "Bank": this.message.bank,
            "Currency": this.message.currency,
            "TransactionId": this.message.transactionId,
            "Type": this.message.type,
            "Reply-Queue": this.message['reply-Queue'],
            "Command": "RequestManualInput",
            "Message": {
                "RequestType": "TOKEN",
                "Text": `PLEASE KEY IN THE 8 DIGIT NUMBER INTO YOUR KEYBCA : ${referenceNumForToken}`
            }
        };


        const mPin = await this.tokenService.getToken(mPinRequestPayload);
        await functionFrame.waitForSelector(this.selectors.fundTransfer.keyBCA, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const keyBCAInput = await functionFrame.$(this.selectors.fundTransfer.keyBCA);
        await keyBCAInput.type(mPin.token, {
            'delay': this.config.get('inputTypeDelay')
        });
        this.takeScreenshot();
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await functionFrame.waitForSelector(this.selectors.fundTransfer.continue, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const continueButton = await functionFrame.$(this.selectors.fundTransfer.continue);

        await functionFrame.waitForSelector(this.selectors.fundTransfer.chooseMyListOption, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const chooseMylistRadioBtn = await functionFrame.$(this.selectors.fundTransfer.chooseMyListOption);

        functionFrame.evaluate(e => e.click(), continueButton);
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        let checkTokenError;
        try {
            await functionFrame.waitForSelector(this.selectors.fundTransfer.tokenError, {
                timeout: this.config.get('pageNavigationTimeout')
            });
            return checkTokenError = await functionFrame.$(this.selectors.fundTransfer.tokenError);
        } catch (error) {
            await this.checkmPin2()
        }
        if (checkTokenError) {
            let errMessage = `${this.LOGGER_PREFIX} TRANSACTION::ERROR: Invalid token`;
            this.sendError(errMessage, this.lib.errorCodes.INVALID_ACCOUNT_402);
            await this.sendHtmlLog();
            this.logger.error(errMessage);
            throw `${errMessage}`;
        }

    }

    async checkmPin2() {
        await this.takeScreenshot();
        let mPin2RequestPayload = {
            "Account": this.message.account,
            "Source": this.message.source,
            "Bank": this.message.bank,
            "Currency": this.message.currency,
            "TransactionId": this.message.transactionId,
            "Type": this.message.type,
            "Reply-Queue": this.message['reply-Queue'],
            "Command": "RequestManualInput",
            "Message": {
                "RequestType": "TOKEN",
                "Text": 'Please enter KEYBCA RESPONSE APPLI 1'
            }
        };

        const mPin2 = await this.tokenService.getToken(mPin2RequestPayload);
        const functionFrameMpin = await this.getFrame('atm');
        await functionFrameMpin.waitForSelector(this.selectors.fundTransfer.appliOneInput, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const appliOneInputText = await functionFrameMpin.$(this.selectors.fundTransfer.appliOneInput);
        await appliOneInputText.type(mPin2.token, {
            'delay': this.config.get('inputTypeDelay')
        });

        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await functionFrameMpin.waitForSelector(this.selectors.fundTransfer.submit, {
            timeout: this.config.get('pageNavigationTimeout')
        });
        const submitButton = await functionFrameMpin.$(this.selectors.fundTransfer.submit);
        this.takeScreenshot();
        functionFrameMpin.evaluate(e => e.click(), submitButton);
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        let referenceNum = '';
        try {
            await this.page.waitFor(this.config.get('pageWaitDelay'));
            await functionFrameMpin.waitForSelector(this.selectors.fundTransfer.referenceNumberSelector, {
                timeout: this.config.get('pageNavigationTimeout')
            });

            referenceNum = await functionFrameMpin.evaluate((selector) => {
                return document.querySelector(selector).innerText;
            }, this.selectors.fundTransfer.referenceNumberSelector);
        } catch (error) {
            let errMessage = `${this.LOGGER_PREFIX} TRANSACTION::SUCCESS: Unable to fetch reference Number`;
            this.sendError(errMessage, this.lib.errorCodes.ELEMENT_NOT_FOUND_204, error);
            await this.sendHtmlLog();
            this.logger.error(errMessage);
            throw `${errMessage}`;
        }
        if (referenceNum) {
            referenceNum = this.lib.stripHtml(referenceNum);
            this.logger.info(`${this.LOGGER_PREFIX}  PLEASE KEEP THE REFERENCE NUMBER AS A PROOF OF YOUR TRANSACTION :: REFERENCE NUMBER ${referenceNum}`);
        }
        let transactionUpdatePayload = {
            "Account": this.message.account,
            "Source": this.message.source,
            "Bank": this.message.bank,
            "Currency": this.message.currency,
            "TransactionId": this.message.transactionId,
            "Type": this.message.type,
            "Command": "Status",
            "Message": {
                "Text": "Transaction processed",
                "Status_Id": this.lib.transactionStatus.SUCCESSFUL,
                "Reference": referenceNum
            }
        };


        if (this.mode === 'server') {
            await this.dispatcher.sendRequest(transactionUpdatePayload, 0, true);

        }
        await this.takeScreenshot();
    }



    async logout() {
        await this.page.waitFor(this.config.get('pageWaitDelay'));
        await this.page.goto(this.config.get('logoutUrl'), {
            waitUntil: 'networkidle2',
            timeout: this.config.get('pageNavigationTimeout')
        });
        await this.takeScreenshot();
        this.session = null;
        // Setting page to blank for avoiding memory leakage - https://github.com/GoogleChrome/puppeteer/issues/1490
        await this.page.goto('about:blank');
        await this.page.close();
    }

    /**
     * Logout the exiting session if available and stops the browser
     * @returns {Promise<void>}
     */

    async stop() {
        if (this.loggedIn) {
            try {
                await this.logout();
            } catch (error) {

                let errMessage = `${this.LOGGER_PREFIX} Error while stopping.`;
                this.logger.error(errMessage);
                await this.takeScreenshot();
                await this.sendHtmlLog();
                throw `${errMessage} :: ${error}`;
            }
        }
        await this.browser.close();
        this.running = false;
        this.logger.info(`${this.LOGGER_PREFIX} process has been completed`);

    }


}

module.exports = Robot;
