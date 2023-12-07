import {CirkwiApi} from './core/api';
import {Translator} from './core/i18n';
import {on, showAlert} from './core/utils';
import { RecaptchaService } from './core/recaptcha';
import documentReady from 'document-ready-promise';
import Deferred from 'promise-deferred';
import Handlebars from 'handlebars/runtime';

import {LoginForm} from './components/forms/login/login-form';
import {RegisterForm} from './components/forms/register/register-form';
import {ModifyPasswordForm} from './components/forms/modify-password/modify-password-form';
import {ResetPasswordForm} from './components/forms/reset-password/reset-password-form';

import "core-js";
import "regenerator-runtime/runtime";
import {DataService} from './core/data';
import {FinishRegistrationForm} from './components/forms/finish-registration/finish-registration-form';
import {Popin} from "./components/popin/popin";
import {Router} from "./core/routing";
import {PreloginForm} from "./components/forms/prelogin/prelogin-form";
import {ErrorFormatter} from "./core/errors";
import fromEntries from '@ungap/from-entries';
import { ProfileManagementForm } from './components/forms/profile-management/profile-management-form';
import {BindAccountForm} from './components/forms/bind-account/bind-account-form';
import {NotificationManager} from './core/notifications';
import {SgvfProfileManagementForm} from './components/forms/sgvf-profile-management/sgvf-profile-management-form';
import {LocationUtils, UrlUtils} from './core/http';

export const DEFAULT_APP_ID = 'cirkwi';

export function getDefaultTosUrl(language) {
    return `https://www.cirkwi.com/${language}/cgu`;
}

class CirkwiCird {

    constructor() {

        const defaultLanguage = 'en';

        this._locked = false; // permet de ne pas spam les demandes
        this._standalone = false;

        this._showTitle = true;

        /**
         * @type {{whitemark: string, universalLinkRoot: string, token: string}}
         * @private
         */
        this._customData = { whitemark: DEFAULT_APP_ID };
        this._globalContext = { microsoftSignIn: true };

        this._translator = new Translator(defaultLanguage);
        this._translator.registerHandlebarsHelper(Handlebars);

        this._errorFormatter = new ErrorFormatter(this._translator);

        Handlebars.helpers.svg = function (name) {
            return require(`../assets/${name}.svg`).default;
        };

        Handlebars.helpers.envFile = function (name) {
            return ENV_FILE[name];
        };

        this._recaptchaService = new RecaptchaService(this);

        this._dataService = new DataService(this);
        this._api = new CirkwiApi(defaultLanguage, this._dataService.getCookieManager());

        this._dataService.initialize(this._api);
        this._notificationManager = new NotificationManager(this._translator);

        this._popin = new Popin(this);

        this._router = new Router(this, {
            register: RegisterForm,
            login: LoginForm,
            resetPassword: ResetPasswordForm,
            modifyPassword: ModifyPasswordForm,
            finishRegistration: FinishRegistrationForm,
            prelogin: PreloginForm,
            profileManagement: ProfileManagementForm,
            sgvfProfileManagement: SgvfProfileManagementForm,
            bindAccount: BindAccountForm
        });

        this._tosLink = function (language, appId) {
            if (['com.cirkwi.marando', 'board_ffrandonnee'].includes(appId)) {
                return 'https://www.ffrandonnee.fr/conditions-generales-d-utilisation-ma-rando';
            }

            return getDefaultTosUrl(language);
        };

        window.addEventListener('formSuccess.cird.ckw', event => {
            if(event.detail.form.getId() === RegisterForm.ID) {
                this._dataService.getUserData().then(data => {
                    this.fireEvent('formSuccess', { apiResult: { data: data}, form: new LoginForm(null, this) });
                });
            }
        });

        this._ready = new Deferred();

        Promise.all([documentReady(), this._ready.promise]).then(() => {

            // On vérifie après chargement de la page si les crédentials OAuth sont présents
            if (!this.checkOAuthParams()) {

                // Si il n'y a pas de cookies dans l'url on vérifie si l'utilisateur est déjà connecté
                // cela permet en même temps de purger les cookies qui ne sont plus valides
                this.isUserLoggedIn();
            }
        })

        // On écoute le changement du hash de l'url et si on est sur la page d'accueil ou
        // sur la page de consultation on retire le recaptcha
        window.addEventListener('hashchange', () => {
            if (['#/home', '#/_/', '#/_'].includes(location.hash)) {
                this._recaptchaService.removeRecaptcha();
            }
        });
    }

    /**
     * @param {string} route
     * @return {boolean}
     */
    canRedirectRouteToOAuth(route) {
        return [
            'register',
            'login',
            'prelogin'
        ].includes(route);
    }

    /**
     * Ouvre la page OAuth du fournisseur passé en paramètre
     * @param {string} provider
     * @param {Record<string, string>} params
     */
    openOAuth(provider, params= {}) {

        // Les paramètres qui permettent de lier le compte précédemment
        // connecté sont gardés en mémoire pendant 15 minutes
        if (Object.entries(params).length === 0) {
            if (localStorage.getItem('ckwCirdOAuthTmp')) {
                try {
                    const data = JSON.parse(localStorage.getItem('ckwCirdOAuthTmp'));

                    if (data.expiry > Date.now()) {
                        if (data.provider === provider) {
                            params = data.params;
                        }
                    }
                    else {
                        localStorage.removeItem('ckwCirdOAuthTmp');
                    }
                }
                catch (e) {
                    localStorage.removeItem('ckwCirdOAuthTmp');
                }
            }
        }

        if (params.bindTo) {
            localStorage.setItem('ckwCirdOAuthTmp', JSON.stringify({
                expiry: Date.now() + 15 * 60_000,
                provider,
                params
            }));
        }

        this.openOAuthUrl(this.getOAuthUrl(provider, '', params), provider);
    }

    /**
     *
     * @param {string} provider
     * @param {string} path
     * @param {Record<string, string>} params
     * @return {string}
     */
    getOAuthUrl(provider, path = '', params = {}) {

        const {universalLinkRoot, whitemark} = this.getCustomData();
        const redirectUrl = universalLinkRoot ? universalLinkRoot + 'cird/oauth' : location.href;

        const queryString = UrlUtils.toQueryString({
            redirectUrl,
            source: whitemark,
            ...params
        });

        return `${this._api._cirkwiOrigin}/${this._api._language}/oauth/${provider}${path}${queryString}`;
    }

    /**
     * @param {string} url
     * @param {string} provider
     */
    openOAuthUrl(url, provider) {

        if (window.cordova) {
            const platform = device.platform;

            // Google n'autorise pas la connexion via une webview (https://support.google.com/accounts/answer/7675428?hl=fr&co=GENIE.Platform%3DDesktop)
            // et Facebook ne l'autorise pas sur Android
            const inAppBrowserDisallowed = provider === 'google' || provider === 'facebook' && platform === 'Android';

            if (typeof cordova.InAppBrowser?.open === 'function' && !inAppBrowserDisallowed) {
                const options = platform === 'iOS' ? 'toolbarposition=top,location=yes' : 'zoom=no';
                const browserRef = cordova.InAppBrowser.open(url, '_blank', options);

                browserRef.addEventListener('loadstart', event => {
                    if (event.url && event.url.startsWith(kwap.environementService.universalLinksRoot)) {
                        kwap.universalLinkService.openLink(event.url);
                        browserRef.close();
                    }
                });
            }
            else {
                window.open(url, '_system');
            }
        }
        else {
            if (this._customData.oauthRedirect) {
                location.href = url;
            }
            else {
                window.open(url);
            }
        }
    }

    _checkIfReady() {
        if (!this._ready.resolved) {
            if (this._api._kwapOrigin && this._api._cirkwiOrigin) {
                this._ready.resolve();
                this._ready.resolved = true;
            }
        }
    }

    /**
     * Envoie un évènement
     * @param {string} type le type de l'évènement
     * @param {Object} detail le données à envoyer avec l'évènement
     * @param {boolean} isRawType false si on doit ajout le namespace au type d'évènement
     */
    fireEvent(type, detail = {}, isRawType = false) {

        if (!isRawType) {
            type = `${type}.cird.ckw`;
        }

        window.dispatchEvent(
            new CustomEvent(type, {bubbles: false, cancelable: false, detail})
        );
    }

    /**
     * Effectue une requête pour voir si l'utilisateur est connecté
     * @return {Promise<boolean>}
     */
    isUserLoggedIn() {
        return this._dataService.isUserLoggedIn();
    }

    /**
     * Déconnecte l'utilisateur
     */
    logout(fireEvent = true, explicit = false) {

        const oAuthLogout = this._dataService.getOAuthLogout();

        if (explicit && oAuthLogout != null && oAuthLogout !== 'none') {
            this.openOAuthUrl(this.getOAuthUrl(oAuthLogout, '/logout'), oAuthLogout);
        }

        this._dataService.clearData();

        if (LocationUtils.hasQueryParameter('ckw_cookies')) {
            LocationUtils.deleteQueryParameter('ckw_cookies', false);
        }

        if (fireEvent) {
            this.fireEvent('logout');
        }
    }

    /**
     * Ferme le CIRD si il est ouvert en mode standalone
     * @param {boolean} fireEvent
     * @return {boolean}
     */
    close(fireEvent = true) {
        this._recaptchaService.removeRecaptcha();
        return this._popin.close(fireEvent);
    }

    /**
     * Retourne le conteneur du formulaire courant
     * @return {HTMLElement}
     */
    getRouterContainer() {
        return document.getElementById('loginContainer');
    }

    /**
     * Charge l'un des composants du CIRD
     * @param {string} route
     * @param {Object} context
     * @param {Object} options
     * @param {HTMLElement} options.container
     * @param {boolean} options.standalone
     * @param {boolean} options.dynamicTitle
     */
    loadRoute(route, context = {}, options = {}) {
        const { standalone = false, container = this.getRouterContainer(), dynamicTitle = false, mode = null } = options;

        if (this._customData.redirectToOAuth && this.canRedirectRouteToOAuth(route)) {
            const [provider, path] = this._customData.redirectToOAuth.split('/');
            this.openOAuth(provider, path);
            return;
        }

        this._standalone = standalone;

        if (standalone) {
            // On déclare le container custom fourni afin de signaler au composant popin.js qu'il n'a pas besoin de créer la popin par défaut
            this._popin._container = container || document.body;

            this._popin.createIfInexistant();
        }

        if(mode){
            this._mode = mode
        }


        if (dynamicTitle) {
            // On garde le titre original de la page pour le restaurer (en cas de fermeture de la popin par exemple) si on veut qu'il change dynamiquement en fonction du formulaire
            this._originalTitle = document.title;
        }

        this._notificationManager._container = container;

        this._router.setContext(route, { whitemark: this.getAppId(), ...this._globalContext, ...context });
        this._router.load(route, standalone, container);
    }

    /**
     * Retourne une promesse qui est résolue quand l'utilisateur se connecte
     * @return {Promise<unknown>}
     */
    ensureLoggedIn(data = {}, hmtlContainer = null, dynamicTitle = false) {


        return this._dataService.isUserLoggedIn().then(loggedIn => {

            if (loggedIn) {
                return;
            }

            this.loadRoute('login', data, { standalone: true, container: hmtlContainer, dynamicTitle: dynamicTitle });

            return new Promise((resolve , reject) => {

                on(window, 'formSuccess.cird.ckw', event => {
                    const {form} = event.detail;

                    if (form.getId() === LoginForm.ID) {
                        this.close(false);
                        resolve();
                    }
                });

                on(window, 'popinClosed.cird.ckw', function () {
                    reject('CKW_CIRD_CLOSED');
                });
            });
        });
    }

    /**
     * Retourne la valeur du header Cookie à passer aux requêtes HTTP pour être authentifié
     * @return {string}
     */
    getAuthenticationHeader() {
        return this._dataService.getAuthenticationHeader();
    }

    /**
     * Retourne l'id de l'utilisateur connecté
     * @return {Promise<number>}
     */
    getUserId() {
        return this._dataService.getUserId();
    }

    /**
     * Retourne le nom public de l'utilisateur connecté
     * @return {Promise<string>}
     */
    getUserName() {
        return this._dataService.getUserName();
    }

    /**
     * Retourne un sous-ensemble de l'attribut _customData
     * @param {string[]} filter une liste des propriétés à retourner
     * @return {{cirkwiToolId: string, whitemark: string, universalLinkRoot: string, token: string}|*}
     */
    getCustomData(filter = []) {

        if (filter.length > 0) {
            return fromEntries(
                Object.entries(this._customData).filter(([key]) => filter.includes(key))
            );
        }

        return this._customData;
    }

    /**
     * @param {string} key
     * @param {*} value
     */
    setCustomData(key, value) {
        this._customData[key] = value;
    }

    /**
     *
     * @param {string} key
     * @param {*} value
     */
    setContextProperty(key, value) {
        this._globalContext[key] = value;
    }

    /**
     * Vérifie la présence des paramèters de connexion OAuth dans l'URL
     */
    checkOAuthParams() {
        if (LocationUtils.hasQueryParameter('ckw_cookies')) {

            this.loginFromOAuth(
                LocationUtils.getQueryParameter('ckw_cookies'),
                LocationUtils.getQueryParameter('oauthLogout'),
                LocationUtils.getQueryParameter('oauthProvider'),
            );

            return true;
        }

        return false;
    }

    /**
     * Effectue une connexion via un cookie passé en paramètre
     * @param {string} setCookie
     * @param {string} oauthLogout
     * @param {string} oauthProvider
     */
    loginFromOAuth(setCookie, oauthLogout = 'none', oauthProvider = 'unknown') {
        const form = new LoginForm(null, this);
        form.loginFromOAuth(setCookie, oauthLogout, oauthProvider);
    }

    /**
     * Retourne true si on est en mode application
     * @return {boolean}
     */
    isInAppMode() {
        return /^com\.cirkwi\..+$/.test(this.getAppId());
    }

    /**
     * Retourne l'id de l'application
     * @return {string}
     */
    getAppId() {
        return this._customData.whitemark;
    }

    /**
     * Setter pour la personnalisation en fonction de l'application/cible
     * @param {string} whiteMark
     */
    setWhiteMark(whiteMark) {
        this._customData.whitemark = whiteMark;
    }

    /**
     * Setter pour le token de réinitialisation de mot de passe
     * @param {string} token
     */
    setToken(token) {
        this._customData.token = token;
    }

    /**
     * Setter pour l'id de l'outil sur lequel la connexion à lieu
     * @param {string} cirkwiToolId 
     */
    setCirkwiToolId(cirkwiToolId) {
        this._customData.cirkwiToolId = cirkwiToolId;
    }

    /**
     * Setter pour la langue
     * @param {string} language
     */
    setLanguage(language) {
        this._api.setLanguage(language);
        this._translator.setLanguage(language);
    }

    /**
     * Setter pour l'origine de l'API Cirkwi
     * @param {string} origin
     */
    setCirkwiOrigin(origin) {
        this._api.setCirkwiOrigin(origin);
        this._checkIfReady();
    }

    /**
     * Setter pour l'origine de l'API KWAP
     * @param {string} origin
     */
    setKwapOrigin(origin) {
        this._api.setKwapOrigin(origin);
        this._checkIfReady();
    }

    /**
     * Setter pour la queryString passée à l'API KWAP
     * @param {string} parameters
     */
    setUrlParameters(parameters) {
        this._api.setKwapQueryString(parameters);
    }

    /**
     * @return {boolean}
     */
    hasCustomTermsOfUse() {
        const currentTos = this._getTermsOfUseLink();
        const defaultTos = this._getTermsOfUseLink(DEFAULT_APP_ID);

        return currentTos !== defaultTos;
    }

    /**
     * @param {string} appId
     * @return {string}
     * @private
     */
    _getTermsOfUseLink(appId = this.getAppId()) {
        return this._translator.getTranslatableProperty(this, '_tosLink', [appId])
    }

    /**
     * Getter du lien vers les conditions d'utilisation
     * @return {string}
     */
    getTermsOfUseLink() {
        return this._getTermsOfUseLink();
    }

    /**
     * Setter du lien vers les conditions d'utilisation
     * @param {string|Object|Function} link
     */
    setTermsOfUseLink(link) {
        this._tosLink = link;
    }

    setUniversalLinkRoot(root) {
        this._customData.universalLinkRoot = root;
    }

    /**
     * true si les requêtes doivent transiter par l'API KWAP
     * @param {boolean} value
     */
    setShouldDirectlyCallCirkwi(value) {
        this._api.setProxyToKwapApi(!value);
    }

    /**
     * Permet d'afficher ou non le titre d'une page "Se connecter" par exemple
     * Il faut appeler cette fonction avant de faire un ensureLoggin sinon le titre va s'afficher
     * @param {boolean} show 
     */
    setShowTitle(show) {
        this._showTitle = show;
    }

    /**
     * Retourne true si le formulaire courant est verrouillé
     * @return {boolean}
     */
    isLocked() {
        return this._locked;
    }

    /**
     * Verrouille le CIRD, retourne false si le verrouillage a échoué
     * @return {boolean}
     */
    lock() {
        if (this._locked) {
            return false;
        }

        this._locked = true;
        return true;
    }

    /**
     * Déverrouille le CIRD
     */
    unlock() {
        this._locked = false;
    }

    getPlatform() {
        const ua = navigator.userAgent;

        if (/android/i.test(ua)) {
            return 'android';
        } else if ((/ipad|iphone|ipod/i.test(ua) || ((/macintosh/i.test(ua)) && /mobile/i.test(ua))) && !window.MSStream) {
            return 'ios';
        }

        return 'browser';
    }

    static UrlUtils = UrlUtils;
}

window.ckwLogin = window.ckwLogin || new CirkwiCird();
