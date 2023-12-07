const handlebars = require('handlebars');
const cookie = require('cookie');
const translationsMap = require('./i18n.json');
const templates = require('./templates');

// Polyfill pour la fonction fetch
require('whatwg-fetch');

function translate(key, language, params = {}) {
    const translations = translationsMap[language] || translationsMap.en;
    const translation = translations[key] || key;

    return translation.replace(/%([a-zA-Z_]+)%/g, function (match, name) {

        if (params.hasOwnProperty(name)) {
            return params[name];
        }

        return match;
    });
}

function getTranslatableProperty(object, key, language) {

    const value = object[key];
    const type = typeof value;

    if (type === 'function') {
        return value(language);
    }
    else if (type === 'object') {
        return value[language];
    }

    return value;
}

const T = translate;

class Login {

    constructor() {
        this.whiteMark = 'cirkwi';
        this.callback = undefined;
        this.loginRender = handlebars.compile(templates.loginTemplate);
        this.registerRender = handlebars.compile(templates.registerTemplate, {noEscape: true});
        this.modifyPasswordRender = handlebars.compile(templates.modifyPasswordTemplate);
        this.resetPasswordRender = handlebars.compile(templates.resetPasswordTemplate);
        this.token = undefined;
        this.language = 'en';
        this.urlParameters = "";
        this.directlyCallCirkwi = false;
        this.hasSetupEvent = false;

        // private
        this.isBusy = false; // permet de ne pas spam les demandes
        this.event = undefined;

        this._tosLink = function (language) {
            return `https://www.cirkwi.com/${language}/cgu`;
        };
    }

    addRegisterToHTML() {
        document.getElementById('registerContainer').innerHTML = this.loginRender();
        document.getElementById('submitform').addEventListener('click', this.submitRegisterForm, false);
    }

    sendFunctionToKwapApi(routeName, data, callback, callEvent = false) {

        this.isBusy = true;

        const valeurs = {
            route: '/' + this.language + routeName,
            options: this.buildQueryString(data)
        };

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        let CIRKWI_SESSION = localStorage.getItem('CIRKWI_SESSION');

        if (CIRKWI_SESSION) {
            CIRKWI_SESSION = JSON.parse(CIRKWI_SESSION);

            if (CIRKWI_SESSION.expires < Date.now()) {
                CIRKWI_SESSION = null;
                localStorage.removeItem('CIRKWI_SESSION');
            }
            else {
                headers['X-Cookie'] = `CIRKWI_SESSION=${CIRKWI_SESSION.value}`;
            }
        }

        fetch(this.kwapUrl + '/cird/callCirkwiFunction' + this.urlParameters, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: this.buildQueryString(valeurs)
        })
            .then(
                response => {

                    if (response.headers.has('X-Set-Cookie')) {

                        const ck = cookie.parse(response.headers.get('X-Set-Cookie'));

                        localStorage.setItem('CIRKWI_SESSION', JSON.stringify({
                            value: ck.CIRKWI_SESSION,
                            expires: Date.parse(ck.expires)
                        }));
                    }

                    return response.json();
                },
                error => {
                    return {
                        status: 'error',
                        message: error.message
                    };
                }
            ).then((fetchRes) => {

            if (typeof callback === 'function') {
                callback(fetchRes);
            }

            this.callback(fetchRes);
            if (callEvent) {
                // if (!this.hasSetupEvent || this.event == undefined) {
                this.event = new CustomEvent("cird-submit", { bubbles: true, cancelable: false, detail: { apiResult: fetchRes } });
                this.hasSetupEvent = true;
                // }
                window.dispatchEvent(this.event);
                setTimeout(() => {
                    window.removeEventListener("cird-submit",() => {}, true);
                }, 2000);
            }
        });
    }

    submitForm() {

        if (this.isBusy) return;


        const el_submitForm = document.getElementById('submitform');
        const el_loginError = document.getElementById('login_error');
        const el_passwordError = document.getElementById('password_error');
        const el_cdfIndentifiantInput = document.getElementById('cdf_identifiantInput');
        const el_cdfPasswordInput = document.getElementById('cdf_passwordInput');

        el_submitForm.innerHTML = T('submitting', this.language);

        el_loginError.innerHTML = '';
        el_passwordError.innerHTML = '';
        el_cdfIndentifiantInput.style.border = "1px solid #404040";
        el_cdfPasswordInput.style.border = "1px solid #404040";

        if (el_cdfIndentifiantInput.value.length === 0 || !el_cdfIndentifiantInput.value.includes('@')) {
            el_loginError.innerHTML = T('emailMissing', this.language);
            el_cdfIndentifiantInput.style.border = "1px solid red";
            el_loginError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            el_submitForm.innerHTML = T('connect', this.language);
            return;
        }

        if (el_cdfIndentifiantInput.value.length > 240) {
            el_loginError.innerHTML = T('emailTooLong', this.language);
            el_cdfIndentifiantInput.style.border = "1px solid red";
            el_loginError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            el_submitForm.innerHTML = T('connect', this.language);
            return;
        }


        if (el_cdfPasswordInput.value.length === 0) {
            el_passwordError.innerHTML = T('passwordMissing', this.language);
            el_cdfPasswordInput.style.border = "1px solid red";
            el_passwordError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            el_submitForm.innerHTML = T('connect', this.language);
            return;
        }

        if (el_cdfPasswordInput.value.length > 100) {
            el_passwordError.innerHTML = T('passwordTooLong', this.language);
            el_cdfPasswordInput.style.border = "1px solid red";
            el_passwordError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            el_submitForm.innerHTML = T('connect', this.language);
            return;
        }

        const url = this.url + "/" + this.language + "/login_check"

        const valeurs = {
            "_username": el_cdfIndentifiantInput.value,
            "_password": el_cdfPasswordInput.value
        }

        const formBody = this.buildQueryString(valeurs);


        this.sendFunctionToKwapApi('/login_check', valeurs, () => {
            this.sendFunctionToKwapApi('/api/kwap/getUserInfo', undefined, (result) => {

                if (!result.data || !result.data.email) {
                    el_loginError.innerHTML = T('wrongLogin', this.language);
                    el_cdfIndentifiantInput.style.border = "1px solid red";
                    el_loginError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    this.unlock();
                    el_submitForm.innerHTML = T('connect', this.language);
                    return false;
                }
            }, true);
        }, false);

    }


    submitModifyPasswordForm() {

        if (this.isBusy) return;

        const el_loginError = document.getElementById('login_error');
        const el_passwordError = document.getElementById('password_error');
        const el_cdfIndentifiantInput = document.getElementById('cdf_identifiantInput');
        const el_cdfPasswordInput = document.getElementById('cdf_passwordInput');

        const el_password = document.getElementById('password');
        const el_confirmPassword = document.getElementById('confirmPassword');
        const el_modifyPasswordError = document.getElementById('modifyPassword_error');
        const el_confirmModifyPasswordError = document.getElementById('confirmModifyPassword_error');
        const el_submitForm = document.getElementById('submitform');


        const password = el_password.value;
        const confirmPassword = el_confirmPassword.value;
        el_modifyPasswordError.innerHTML = '';
        el_confirmModifyPasswordError.innerHTML = '';

        el_submitForm.innerHTML = T('submitting', this.language);

        el_password.style.border = "1px solid #404040";
        el_confirmPassword.style.border = "1px solid #404040"

        if (password.length < 5 ) {
            el_modifyPasswordError.innerHTML = T('minLengthPassword', this.language);
            el_password.style.border = "1px solid red"
            el_modifyPasswordError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('validate', this.language);
        }

        if (password.length > 100 ) {
            el_modifyPasswordError.innerHTML = T('passwordTooLong', this.language);
            el_password.style.border = "1px solid red"
            el_modifyPasswordError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            el_submitForm.innerHTML = T('validate', this.language);
        }

        if (confirmPassword.length < 5 ) {
            el_confirmModifyPasswordError.innerHTML = T('minLengthPassword', this.language);
            el_confirmPassword.style.border = "1px solid red"
            el_confirmModifyPasswordError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            el_submitForm.innerHTML = T('validate', this.language);
        }

        if (password !== confirmPassword) {
            el_confirmModifyPasswordError.innerHTML = T('missmatchPassword', this.language);
            el_password.style.border = "1px solid red"
            el_confirmPassword.style.border = "1px solid red"
            el_password.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            el_submitForm.innerHTML = T('validate', this.language);
            return;
        }

        const url = this.url + "/" + this.language + "/ajax/changePassword";

        const valeurs = {
            "password": password,
            "passwordConfirm": confirmPassword,
            "from_modulesbox": false,
            "FromKWAP": 'yes',
            "token": this.token,
            "needToBeNeutral": true,
            "whitemark": this.whiteMark
        }

        const formBody = this.buildQueryString(valeurs);

        if (!this.directlyCallCirkwi) {
            this.sendFunctionToKwapApi('/ajax/changePassword', valeurs, undefined, true);
        } else {
            fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formBody
            })
                .then((data) => {
                    if (!this.hasSetupEvent || this.event == undefined) {
                        this.event = new CustomEvent("cird-submit", { bubbles: true, cancelable: false, detail: data });
                        this.hasSetupEvent = true;
                    }
                    window.dispatchEvent(this.event);
                    this.callback();
                })
                .catch(function (error) {
                    console.log('Request failed', error);
                });
        }


    }

    submitRegisterForm() {

        if (this.isBusy) return;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const cgu = document.getElementById('cgu').value;

        const url = this.url + "/" + this.language + "/ajax/faireInscription"

        const cgu_url = this.url + "/" + this.language + "cgu/accept"

        const cgu_valeurs = {
            "cdf_CGUInput": true,
            "page": ""
        }

        const cguBody = this.buildQueryString(cgu_valeurs);


        document.getElementById('submitform').innerHTML = T('submitting', this.language);


        document.getElementById('email_error').innerHTML = ""
        document.getElementById('pwd_error').innerHTML = ""
        document.getElementById('confirm_pwd_error').innerHTML = ""
        document.getElementById('cgu_error').innerHTML = "";

        document.getElementById('email').style.border = "1px solid #404040"
        document.getElementById('password').style.border = "1px solid #404040"
        document.getElementById('confirmPassword').style.border = "1px solid #404040"
        document.getElementById('cgu').style.border = "1px solid #404040"

        if (email.length <= 0 || !email.includes('@')) {
            document.getElementById('email_error').innerHTML = T('emailMissing', this.language);
            document.getElementById('email').style.border = "1px solid red"
            document.getElementById('email_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);

            document.getElementById('submitform').innerHTML = T('register', this.language);
            return;
        }

        if (email.length > 240 ) {
            document.getElementById('email_error').innerHTML = T('emailTooLong', this.language);
            document.getElementById('email').style.border = "1px solid red"
            document.getElementById('email_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);

            document.getElementById('submitform').innerHTML = T('register', this.language);
            return;
        }

        if (password.length <= 0) {
            document.getElementById('pwd_error').innerHTML = T('passwordMissing', this.language);
            document.getElementById('password').style.border = "1px solid red"
            document.getElementById('pwd_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('register', this.language);
            return;
        }

        if (password.length > 100 ) {
            document.getElementById('pwd_error').innerHTML = T('passwordTooLong', this.language);
            document.getElementById('password').style.border = "1px solid red"
            document.getElementById('pwd_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('register', this.language);
            return;
        }

        if (confirmPassword.length <= 0 || confirmPassword.length > 40 ) {
            document.getElementById('confirm_pwd_error').innerHTML = T('passwordMissing', this.language);
            document.getElementById('confirmPassword').style.border = "1px solid red"
            document.getElementById('confirm_pwd_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('register', this.language);
            return;
        }

        if (password !== confirmPassword) {
            document.getElementById('confirm_pwd_error').innerHTML = T('missmatchPassword', this.language);
            document.getElementById('password').style.border = "1px solid red"
            document.getElementById('confirmPassword').style.border = "1px solid red"
            document.getElementById('password').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('register', this.language);
            return;
        }

        if (password.length < 5 || password.length > 100 ) {
            document.getElementById('pwd_error').innerHTML = T('minLengthPassword', this.language);
            document.getElementById('password').style.border = "1px solid red"
            document.getElementById('pwd_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('register', this.language);
            return;
        }

        if (!document.getElementById('cgu').checked) {
            document.getElementById('cgu_error').innerHTML = T('cguMissing', this.language);
            document.getElementById('cgu').style.border = "1px solid red"
            document.getElementById('cgu_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('register', this.language);
            return;
        }

        const valeurs = {
            "email": email,
            "password": password,
            "confirm_password": confirmPassword,
            "from_modulesbox": false,
            "FromKWAP": "yes",
            "needToBeNeutral": true,
            "whitemark": this.whiteMark
        }


        const formBody = this.buildQueryString(valeurs);


        this.sendFunctionToKwapApi('/ajax/faireInscription', valeurs, (data) => {
            // if (data['erreur'] != undefined) {
            //     document.getElementById('email_error').innerHTML = T('accountAlreadyExist', this.language);
            //     document.getElementById('email').style.border = "1px solid red"
            //     document.getElementById('email_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            //     setTimeout(() => {
            //         window.scrollBy(0,-50)
            //         }, 1000);
            //     document.getElementById('submitform').innerHTML = T('register', this.language);
            //     return false;
            // }

            if (data.status === 'error') {

                if (data.statusCode === 400) {
                    document.getElementById('email_error').innerHTML = T('accountAlreadyExist', this.language);
                    document.getElementById('email').style.border = "1px solid red";
                    document.getElementById('email_error').scrollIntoView({behavior: 'smooth', block: 'nearest'});

                    document.getElementById('submitform').innerHTML = T('register', this.language);
                }

                this.unlock();
                return false;
            }
            else {

            }

            this.callback(data);

            this.sendFunctionToKwapApi('/cgu/accept', cgu_valeurs, undefined, true)
        });

    }

    getUserInfo(callback) {
        this.callback = callback;
        this.sendFunctionToKwapApi('/api/kwap/getUserInfo', undefined, (res) => {
            // en gros, si on a une adresse email dans la réponse et pas une erreur
            if (data.includes('@')) {
                document.getElementById('login_error').innerHTML = T('emailMissing', this.language);
                document.getElementById('cdf_identifiantInput').style.border = "1px solid red";
                document.getElementById('login_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                this.unlock();
                document.getElementById('submitform').innerHTML = T('login', this.language);
                return false;
            }
        }, false);
    }

    submitResetPasswordForm() {

        if (this.isBusy) return;

        const email = document.getElementById('cdf_identifiantInput').value;
        const url = this.url + "/" + this.language + "ajax/faireReinitialisation"

        document.getElementById('submitform').innerHTML = T('submitting', this.language);

        if (email.length === 0 || !email.includes('@')) {
            document.getElementById('mail_error').innerHTML = T('emailMissing', this.language);
            document.getElementById('mail_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('reset', this.language);
            return;
        }

        if (email.length > 240 ) {
            document.getElementById('mail_error').innerHTML = T('emailTooLong', this.language);
            document.getElementById('mail_error').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                window.scrollBy(0,-50)
            }, 1000);
            document.getElementById('submitform').innerHTML = T('reset', this.language);
            return;
        }

        const valeurs = {
            "email": email,
            "whitemark": this.whiteMark,
            "needToBeNeutral": true
        }

        const formBody = this.buildQueryString(valeurs);

        this.sendFunctionToKwapApi('/ajax/faireReinitialisation', valeurs, undefined, true);

    }

    buildQueryString(valeurs) {
        let formBody = [];

        for (let property in valeurs) {
            let encodedKey = encodeURIComponent(property);
            let encodedValue = encodeURIComponent(valeurs[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }

        formBody = formBody.join("&");
        return formBody;
    }

    addTemplateToHTML(template, callback) {
        this.callback = callback;
        switch (template) {
            case 'login':
                document.getElementById('loginContainer').innerHTML = this.loginRender({ email: T('email', this.language), password: T('password', this.language), login: T('connect', this.language), noAccount: T('noAccount', this.language), forgottenPassword: T('forgottenPassword', this.language) });
                document.getElementById('submitform').addEventListener('click', this.submitForm.bind(this), false);
                break;
            case 'register':
                document.getElementById('loginContainer').innerHTML = this.registerRender({ email: T('email', this.language), password: T('password', this.language), confirmPassword: T('confirmPassword', this.language), register: T('register', this.language), cgu: T('cgu', this.language), cguText: T('cguText', this.language, { tos_link: this.getTermsOfUseLink() }), hasAccount: T('hasAccount', this.language) });
                document.getElementById('submitform').addEventListener('click', this.submitRegisterForm.bind(this), false);
                document.getElementById('cguckbx_label').addEventListener('click', () => { document.getElementById('cgu').checked = !document.getElementById('cgu').checked }, false)
                break;
            case 'resetPassword':
                document.getElementById('loginContainer').innerHTML = this.resetPasswordRender({ email: T('email', this.language), reset: T('reset', this.language) });
                document.getElementById('submitform').addEventListener('click', this.submitResetPasswordForm.bind(this), false);
                break;
            case 'modifyPassword':
                document.getElementById('loginContainer').innerHTML = this.modifyPasswordRender({ newPassword: T('newPassword', this.language), confirmPassword: T('confirmPassword', this.language), validate: T('validate', this.language) });
                document.getElementById('submitform').addEventListener('click', this.submitModifyPasswordForm.bind(this), false);
                break;
        }

    }

    setWhiteMark(whiteMark) {
        this.whiteMark = whiteMark;
    }

    setToken(token) {
        this.token = token;
    }

    setLanguage(language) {
        this.language = language;
    }

    setCirkwiUrl(url) {
        this.url = url;
    }

    setKwapUrl(url) {
        this.kwapUrl = url;
    }

    setUrlParameters(parameters) {
        this.urlParameters = parameters;
    }

    setShouldDirectlyCallCirkwi(value) {
        this.directlyCallCirkwi = value;
    }

    isLock() {
        return this.isBusy;
    }

    lock() {
        this.isBusy = true;
    }

    unlock() {
        this.isBusy = false;
    }

    /**
     * Getter du lien vers les conditions d'utilisation
     * @return {string}
     */
    getTermsOfUseLink() {
        return getTranslatableProperty(this, '_tosLink', this.language);
    }

    /**
     * Setter du lien vers les conditions d'utilisation
     * @param {string|Object|Function} link
     */
    setTermsOfUseLink(link) {
        this._tosLink = link;
    }
}



window.ckwLogin = new Login();
