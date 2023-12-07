import {getProperty} from 'dot-prop';

export class Translator {

    /**
     * @param {string} language
     */
    constructor(language) {
        this._language = language;
        this._translations = require('../../assets/i18n.json');
    }

    /**
     * Setter pour le langage
     * @param {string} language
     */
    setLanguage(language) {
        this._language = language;
    }

    /**
     * Retourne la traduction associée à la clé passée en paramètre
     * @param {string} key
     * @param {Object} options
     * @return {string}
     */
    translate(key, options = {}) {

        if (!key) {
            console.warn('translate method was called without key');
            return;
        }

        const params = options.hash || {};
        const translations = this._translations[this._language] || this._translations.en;
        const translation =  getProperty(translations, key, key);

        return translation.replace(/%([a-zA-Z_]+)%/g, function (match, name) {

            if (params.hasOwnProperty(name)) {
                return params[name];
            }

            return match;
        });
    }

    /**
     * Ajout le helper trans à Handlebars
     * @param {Handlebars} handlebars
     */
    registerHandlebarsHelper(handlebars) {
        handlebars.helpers.trans = this.translate.bind(this);
    }

    /**
     * Retourne la valeur traduite d'une propriété traduisible
     * @param {Object} object
     * @param {string} key
     * @param {unknown[]} args
     * @return {string}
     */
    getTranslatableProperty(object, key, args = []) {

        const value = object[key];
        const type = typeof value;

        if (type === 'function') {
            return value(this._language, ...args);
        }
        else if (type === 'object') {
            return value[this._language];
        }

        return value;
    }
}
