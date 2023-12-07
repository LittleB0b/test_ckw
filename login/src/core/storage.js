import debounce from 'debounce';

/**
 * Une structure de données comme Map mais est persistée dans le localStorage
 */
export class PersistentMap {

    /**
     * @param {string} name
     */
    constructor(name) {
        this._name = name;
        this._read();
    }

    /**
     * Retourne la taille de la structure
     * @return {number}
     */
    size() {
        return this.keys().length;
    }

    /**
     * Retourne true si la structure contient un élément avec la clé passée en paramètre
     * @param {string} key
     * @return {boolean}
     */
    has(key) {
        return this._data.hasOwnProperty(key);
    }

    /**
     * Retourne l'élément correspondant à la clé passée en paramètre
     * @param {string} key
     * @return {*}
     */
    get(key) {

        if (this.has(key)) {
            return this._data[key];
        }

        return undefined;
    }

    /**
     * Ajoute une pair clé/valeur à la structure
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        this._data[key] = value;
        this._write();
    }

    /**
     * Supprime l'élément correspondant à la clé passée en paramètre
     * @param {string} key
     */
    delete(key) {
        if (this.has(key)) {
            delete this._data[key];
            this._write();
        }
    }

    /**
     * Supprime tous les éléments
     */
    clear() {
        this._data = {};
        this._write();
    }

    /**
     * Ecrit immédiatement tous les changements effectués
     */
     flush() {
        this._write.flush();
    }

    /**
     * Rempli la structure à partir du localStorage
     * @private
     */
    _read() {
        const json = localStorage.getItem(this._name);

        if (typeof json === 'string') {
            try {
                this._data = JSON.parse(json);
            } catch (e) {
                console.warn(e);
            }
        }

        if (this._data == null) {
            this._data = {};
        }
    }

    /**
     * Ecrit le contenu de la structure dans le localStorage
     * @private
     */
    __doWrite() {
        const json = JSON.stringify(this._data);
        localStorage.setItem(this._name, json);
    }

    /**
     * Ecrit le contenu de la structure dans le localStorage après un délai
     * @private
     */
    _write = debounce(this.__doWrite.bind(this));

    /**
     * Retourne la liste des clés de la structure
     * @return {string[]}
     */
    keys() {
        return Object.keys(this._data)[Symbol.iterator]();
    }

    /**
     * Retourne la liste des valeurs de la structure
     * @return {*}
     */
    values() {
        return Object.values(this._data)[Symbol.iterator]();
    }

    /**
     * Retourne la liste des pairs clé/valeur de la structure
     * @return {*}
     */
    entries() {
        return Object.entries(this._data)[Symbol.iterator]();
    }

    [Symbol.iterator]() {
       return this.entries();
    }
}
