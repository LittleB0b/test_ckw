import {HttpClient, UrlUtils} from './http';
import {FormDataEncoder, isFile} from "form-data-encoder";
import {concat} from 'uint8arrays/concat';
import {toString} from 'uint8arrays/to-string';

async function encodeFormDataToString(data) {
    return toString(concat((await asyncIteratorToArray(data))), 'base64');
}

async function asyncIteratorToArray(asyncIterator){
    const arr=[];
    for await(const i of asyncIterator) arr.push(i);
    return arr;
}

/**
 * @typedef {Object} ApiResult
 * @property {string} status
 * @property {string} message
 * @property {*} data
 */
export class CirkwiApi {

    /**
     * @param {string} language
     * @param {CookieManager} cookieManager
     */
    constructor(language, cookieManager) {
        this._language = language;

        this._proxyToKwapApi = true;
        this._kwapOrigin = null;
        this._kwapQueryString = null;
        this._cirkwiOrigin = '';

        this._http = new HttpClient({ cookieManager });
    }

    /**
     * Le langage utilisé pour les requêtes sur l'API Cirkwi
     * @param {string} language
     */
    setLanguage(language) {
        this._language = language;
    }

    /**
     * true si on doit faire transiter les requêtes via l'API KWAP
     * @param {boolean} proxyToKwapApi
     */
    setProxyToKwapApi(proxyToKwapApi) {
        this._proxyToKwapApi = proxyToKwapApi;
    }

    /**
     * L'origine de l'API KWAP
     * @param {string} origin
     */
    setKwapOrigin(origin) {
        this._kwapOrigin = origin;
    }

    /**
     * Une query string à ajouté aux requêtes sur l'API KWAP
     * @param {string} queryString
     */
    setKwapQueryString(queryString) {
        this._kwapQueryString = queryString;
    }

    /**
     * L'origine de l'API Cirkwi
     * @param {string} origin
     */
    setCirkwiOrigin(origin) {
        this._cirkwiOrigin = origin;
    }

    /**
     * Vérifie que certains attributs sont bien défini
     * @param {string[]} attributes
     * @private
     */
    _checkUndefined(attributes) {
        for (const attribute of attributes) {
            if (this[attribute] == null) {
                throw new Error(`attribute ${attribute} is not defined`);
            }
        }
    }

    /**
     * Envoie une requête sur l'API Cirkwi
     * @param {string} route la route à interroger
     * @param {Object|null} data les données à envoyer
     * @param {Object} options
     * @return {Promise<ApiResult>}
     */
    async sendRequest(route, data, options = {}) {
        let url;

        options.method = options.method || 'GET';

        // Si on doit faire transiter la requête par kwap-api
        if (this._proxyToKwapApi) {
            this._checkUndefined(['_kwapOrigin']);

            let body
            let multipartBoundary = ""

            if(data instanceof FormData){
                const encoder = new CustomEncoder(data)
                body = await encodeFormDataToString(encoder.encode())
                multipartBoundary = encoder.boundary
            }else {
                body = UrlUtils.toParamsString(data)
            }

            url = this._kwapOrigin + '/cird/callCirkwiFunction' + (this._kwapQueryString || '');
                data = {
                    multipartBoundary,
                    method: options.method,
                    route: `/${this._language}${route}${UrlUtils.toQueryString(options.query)}`,
                    options: body
                };
            options.method = 'POST';
            options.query = {cookieMode: 2};
        }
        else {
            this._checkUndefined(['_cirkwiOrigin']);
            url = `${this._cirkwiOrigin}/${this._language}${route}`;
        }

        if (['HEAD', 'GET'].indexOf(options.method) > -1) {
            options.query = { ...options.query, ...data };
        }
        else if (['PUT', 'POST', 'PATCH'].indexOf(options.method) > -1) {
            options.form_params = { ...options.form_params, ...data };
        }

        return this._http.sendRequest(url, options)
        .then(response => {
            return response.text().then(text => {

                let apiResult;

                try {
                    apiResult = JSON.parse(text);
                }
                catch (e) {
                    apiResult = {
                        status: 'unknown',
                        data: text
                    };
                }

                return apiResult;
            });
        }, error => {
            return {
                status: 'error',
                message: error.message
            };
        });
    }




    get(route, data, options = {}) {
        return this.sendRequest(route, data, {
            ...options,
            method: 'GET'
        });
    }

    post(route, data, options = {}) {
        return this.sendRequest(route, data, {
            ...options,
            method: 'POST'
        });
    }
}

export class CustomEncoder extends FormDataEncoder
{
    async* encode() {
        for (const part of this.values()) {
          if (isFile(part)) {
            yield await this.readableStreamToAsyncIterator(part)
          } else {
            yield part
          }
        }
      }

    async readableStreamToAsyncIterator(file){
        return new Promise((resolve, reject) => {let fileReader = new FileReader()
            fileReader.readAsArrayBuffer(file)
            fileReader.onload = () => {
                resolve(new Uint8Array(fileReader.result))
            }
        })
    }
}
