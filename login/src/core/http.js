
// Polyfill pour la fonction fetch
import 'whatwg-fetch';

export class HttpClient {

    constructor(options = {}) {
        if (options.cookieManager) {
            this._cookieManager = options.cookieManager;
        }
    }

    /**
     * Envoie une requête HTTP
     * @param {string} url
     * @param {Object} options
     * @return {Promise<Response>}
     */
    sendRequest(url, options) {


        const fetchOptions = {
            method: options.method,
            headers: options.headers || {}
        };

        if(options.form_data instanceof FormData){
            fetchOptions.body = options.form_data
        }
        else if (options.form_params) {
            fetchOptions.body = UrlUtils.toParamsString(options.form_params);
            fetchOptions.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        if (options.cookies) {
            if (this._cookieManager) {
                const cookieHeader = this._cookieManager.getCookieHeader();

                if (cookieHeader) {
                    fetchOptions.headers['X-Cookie'] = cookieHeader;
                }
            }
            else {
                fetchOptions.credentials = 'include';
            }
        }

        if (options.query && Object.keys(options.query).length > 0) {
            url = UrlUtils.addQueryParamsToUrl(url, options.query);
        }

        if (options.credentials) {
            fetchOptions.credentials = options.credentials;
        }

        return fetch(url, fetchOptions).then(response => {

            if (this._cookieManager) {
                this._cookieManager.readSetCookieHeaderFromResponse(response, 'X-Set-Cookie');
            }

            return response;
        });
    }
}

/**
 * Une classe pour parser et construire des urls / query string
 */
export class UrlUtils {

    /**
     * Permet de parser une chaine contenant des paramètres
     * @param {string} paramsString
     * @return {{}}
     */
    static parseParamsString(paramsString) {
        const params = {};

        if (paramsString.length) {
            const rawParams = paramsString.split('&');

            for (const rawParam of rawParams) {
                const [rawKey, rawValue] = rawParam.split('=');

                const key = decodeURIComponent(rawKey);
                params[key] = decodeURIComponent(rawValue);
            }
        }

        return params;
    }

    /**
     * Permet de parser une query string
     * @param {string} queryString
     * @return {{}}
     */
    static parseQueryString(queryString) {
        const parametersString = queryString.substr(1);
        return UrlUtils.parseParamsString(parametersString);
    }

    /**
     * Transforme une liste de paramètres en chaine
     * @param {Object} params
     * @param {string} prefix
     * @return {string|string}
     */
    static toParamsString(params, prefix = '') {
        let rawParams;

        if (params) {
            rawParams = Object.entries(params).map(([key, value]) => {
                return encodeURIComponent(key) + '=' + encodeURIComponent(value);
            });
        }
        else {
            rawParams = [];
        }

        return rawParams.length > 0 ? prefix + rawParams.join('&') : '';
    }

    /**
     * Transforme une liste de paramètre en query string
     * @param {Object} parameters
     * @return {string}
     */
    static toQueryString(parameters) {
        return UrlUtils.toParamsString(parameters, '?');
    }

    /**
     * Modifie les paramètres GET d'une url
     * @param {string} url
     * @param {(params: Record<string, string>) => Record<string, string>} callback
     * @returns {string}
     * @private
     */
    static _updateQueryString(url, callback) {
        const anchor = document.createElement('a');

        anchor.href = url;

        const queryParams =  UrlUtils.parseQueryString(anchor.search);
        const updatedQueryParams = callback(queryParams);

        anchor.search = UrlUtils.toQueryString(updatedQueryParams);

        return anchor.href;
    }

    /**
     * Ajout des paramètres à la query string d'une url
     * @param {string} url
     * @param {Object} params
     * @return {string}
     */
    static addQueryParamsToUrl(url, params) {
        return this._updateQueryString(url, queryParams => {
            return { ...queryParams, ...params };
        });
    }

    /**
     * Supprime des paramètres de la query string d'une url
     * @param {string} url
     * @param {string[]} params
     * @returns {string}
     */
    static deleteQueryParamsFromUrl(url, params) {
        return this._updateQueryString(url, queryParams => {

            for (const param of params) {
                delete queryParams[param];
            }

            return queryParams;
        });
    }
}

export class LocationUtils {

    /**
     *
     * @param {string} key
     * @return {boolean}
     */
    static hasQueryParameter(key) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key) !== null;
    }

    /**
     * @param {string} key
     * @return {string}
     */
    static getQueryParameter(key) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key);
    }

    /**
     * @param {string} key
     * @param {boolean} reload
     */
    static deleteQueryParameter(key, reload = false) {
        const url = UrlUtils.deleteQueryParamsFromUrl(window.location,[key]);

        if (reload) {
            location.href = url;
        }
        else {
            history.pushState({}, '', url);
        }
    }
}
