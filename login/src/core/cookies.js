import SetCookieParser from 'set-cookie-parser';
import fromEntries from '@ungap/from-entries';

import {PersistentMap} from './storage';

export class CookieManager extends PersistentMap {

    /**
     * @param {string} name le nom de l'élement du localStorage contenant les cookies
     */
    constructor(name) {
        super(name);
        this._pruneExpiredCookies();
    }

    /**
     * Supprime un cookie si il est expiré
     * @param {Object} cookie
     * @param {number} now
     * @return {boolean}
     * @private
     */
    _pruneIfExpired(cookie, now = Date.now()) {
        if (cookie.expires <= now) {
            this.delete(cookie.name);
            return true;
        }

        return false;
    }

    /**
     * Supprime les cookies expirés
     * @private
     */
    _pruneExpiredCookies() {
        const now = Date.now();

        for (const cookie of this.values()) {
            this._pruneIfExpired(cookie, now);
        }
    }

    /**
     * Retourne true si le cookie existe et est valide
     * @param {string} name le nom du cookie à tester
     * @return {boolean}
     */
    hasCookie(name) {

        if (this.has(name)) {
            const cookie = this.get(name);
            return !this._pruneExpiredCookies(cookie);
        }

        return false;
    }

    /**
     * Retourne les cookies
     * @return {Object}
     */
    getCookies() {
        this._pruneExpiredCookies();
        return fromEntries(this);
    }

    /**
     * Ajoute des cookies
     * @param {Object} cookies
     * @param {boolean} replace remplace tous les cookies existants
     */
    setCookies(cookies, replace = false) {

        if (replace) {
            this.clear();
        }

        for (const cookie of Object.values(cookies)) {
            this.set(cookie.name, cookie);
        }
    }

    /**
     * Construit un header Cookie à partir de cookies de l'utilisateur
     * @return {string}
     */
    getCookieHeader() {
        const rawCookies = [];

        for (const cookie of Object.values(this.getCookies())) {
            rawCookies.push(`${cookie.name}=${encodeURIComponent(cookie.value)}`);
        }

        return rawCookies.join('; ');
    }

    /**
     * Ajoute des cookies à partir des headers Set-Cookie de la réponse en paramètre
     * @param {Response} response
     * @param {string} headerName
     */
    readSetCookieHeaderFromResponse(response, headerName = 'Set-Cookie') {
        if (response.headers.has(headerName)) {
            const combinedHeader = response.headers.get(headerName);
            this.readSetCookieHeader(response.headers.get(headerName));
        }
    }

    /**
     * Ajoute des cookies à partir d'un header Set-Cookie
     * @param {string} combinedHeader
     */
    readSetCookieHeader(combinedHeader) {

        const headers = SetCookieParser.splitCookiesString(combinedHeader);
        const cookies = SetCookieParser.parse(headers, {map: true});

        // Correction pour Firefox qui a un problème au niveau du parsage de Date
        // https://github.com/nfriedly/set-cookie-parser/issues/35
        for (const cookie of Object.values(cookies)) {
            const {expires} = cookie;

            if (expires.getFullYear() < 0) {
                expires.setFullYear(-expires.getFullYear());
            }
        }

        this.setCookies(cookies);
    }
}
