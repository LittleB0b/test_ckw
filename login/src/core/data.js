import {CookieManager} from './cookies';
import {PersistentMap} from './storage';
import {defer} from "./utils";

/**
 * Gère les données qui sont persistés côté client
 */
export class DataService {

    /**
     * @param {CirkwiCird} cird
     */
    constructor(cird) {
        this._cird = cird;
        this._data = new PersistentMap('ckwCirdData');
        this._cookies = new CookieManager('ckwCirdCookies');
        this._convertLegacyStorage();
    }

    /**
     * @param {CirkwiApi} api
     */
    initialize(api) {
        this._api = api;
    }

    /**
     * Converti l'ancien système de stockage de la session vers le nouveau système
     * @private
     */
    _convertLegacyStorage() {
        const legacyStorageKey = 'CIRKWI_SESSION';
        const rawCookie = localStorage.getItem(legacyStorageKey);

        if (rawCookie) {
            try {
                const cookie = JSON.parse(rawCookie);
                this._cookies.setCookies({ [legacyStorageKey]: cookie });
            } catch(e) {}

            localStorage.removeItem(legacyStorageKey);
        }
    }

    /**
     * Retourne true si le cookie CIRKWI_SESSION est valide
     * @return {boolean}
     * @private
     */
    _hasSessionCookie() {
        return this._cookies.hasCookie('CIRKWI_SESSION');
    }

    /**
     * Retourne true si le cookie CIRKWI_REMEMBER est valide
     * @return {boolean}
     * @private
     */
    _hasRememberMeCookie() {
        return this._cookies.hasCookie('CIRKWI_REMEMBER');
    }

    /**
     * Retourne true si un des deux cookies CIRKWI_SESSION ou CIRKWI_REMEMBER est valide
     * @return {boolean}
     */
    mightBeLoggedIn() {
        return this._hasSessionCookie() || this._hasRememberMeCookie();
    }

    /**
     * Retourne l'instance de CookieManager utilisée
     * @return {CookieManager}
     */
    getCookieManager() {
        return this._cookies;
    }

    /**
     * Retourne la valeur du header Cookie à passer au requêtes HTTP pour s'authentifier
     * @return {string}
     */
    getAuthenticationHeader() {
        return this._cookies.getCookieHeader();
    }

    /**
     * @return {string}
     */
    getOAuthProvider() {
        return this._data.get('oauthProvider');
    }

    /**
     * @param {string} provider
     */
    setOAuthProvider(provider) {
        this._data.set('oauthProvider', provider);
    }

    /**
     * @return {string}
     */
    getOAuthLogout() {
        return this._data.get('oauthLogout');
    }

    /**
     * @param {string} provider
     */
    setOAuthLogout(provider) {
        this._data.set('oauthLogout', provider);
    }

    /**
     * Effectue une requête pour voir si l'utilisateur est connecté
     * @return {Promise<boolean>}
     */
    isUserLoggedIn() {

        if (!this.mightBeLoggedIn()) {
            return Promise.resolve(false);
        }

        return this._api.get('/auth/user/connected', null, {
            cookies: true,
            credentials: 'include'
        })

        .then(apiResult => {
            const loggedIn = apiResult.data;

            if (!loggedIn) {
                // Si on est arrivé jusqu'ici, c'est que l'on avait un ou deux cookies
                // et qu'ils ne sont plus valides donc on force la déconnexion
                this._cird.logout(true, false);
            }

            return loggedIn;
        });
    }

    /**
     * Récupère les données l'utilisateur connecté (id, nom publique, email) depuis le serveur
     * @return {Promise<Object>}
     * @private
     */
    _fetchUserData() {

        return this.isUserLoggedIn().then(loggedIn => {

            if (!loggedIn) {
                throw new Error('CONNECTION_REQUIRED');
            }

            return this._api.get('/api/kwap/getUserInfo', { apiMode: 1 }, { cookies: true }).then(apiResult => {
                this._data.set('user', apiResult.data);
                return apiResult.data;
            });
        });
    }

    /**
     * Retourne les données l'utilisateur connecté
     * @return {Promise<boolean>|*}
     */
    getUserData() {

        if (this._data.has('user')) {
            return Promise.resolve(this._data.get('user'));
        }

        return this._fetchUserData();
    }

    /**
     * Retourne l'id de l'utilisateur
     * @return {Promise<number>}
     */
    getUserId() {
        return this.getUserData().then(userData => userData.id);
    }

    /**
     * Retourne le nom publique de l'utilisateur
     * @return {Promise<string>}
     */
    getUserName() {
        return this.getUserData().then(userData => userData.publicName);
    }

    /**
     *
     * @param {string} email
     * @param forceSuccessNotification
     * @return {Promise<ApiResult>}
     */
    async resetPassword(email, forceSuccessNotification = false) {
        let data = {
            email,
            apiMode: 1,
        };

        // On récupère la whitemark
        const whiteMark = this._cird.getCustomData(['whitemark']);

        // On l'ajoute si y'en a une
        if(whiteMark){
            data = { ...data, ...whiteMark };
        }

        const apiResult = await this._api.post('/ajax/faireReinitialisation', data);

        if (apiResult.status === 'success' && (this._cird._standalone || forceSuccessNotification)) {
            defer(() => {
                // Affiche une notification pour prévenir qu'un mail a été envoyé
                this._cird._notificationManager.notify('emailReset');
            });
        }

        return apiResult;
    }

    /**
     * Supprime les données persistés côté client
     */
    clearData() {
        this._cookies.clear();
        this._data.clear();

        this._cookies.flush();
        this._data.flush();
    }
}
