import './popin.scss';
import {on} from '../../core/utils';

/**
 * Gère la popin qui contient les différents formulaires quand le cird est en mode standalone
 */
export class Popin {

    /**
     * @param {CirkwiCird} cird
     */
    constructor(cird) {
        this._cird = cird;
        this._container = document.body;
        this._popinContainer = null;

        window?.kwap?.globalEventManager.addListener('back-button', () => {
            if (this.close()) {
                return 3; // STOP_PROPAGATION | PREVENT_DEFAULT
            }
        }, -1);
    }

    /**
     * Créer le DOM de la popin
     * @return {HTMLDivElement}
     * @private
     */
    _create() {
        const popinContainer = document.createElement('div');
        popinContainer.className = 'ckw-cird__popin-container';
        popinContainer.innerHTML = require('./popin.hbs')();
        this._container.appendChild(popinContainer);

        this._popinContainer = popinContainer;

        // On écoute le click sur la croix de fermeture de la popin
        on(popinContainer.querySelector('.ckw-cird__popin-close'), 'click', () => {
            this._cird.close();
            
            // Si l'option de titre dynamique est activée, on reset le titre de la page original quand on ferme la popin
            this.resetPageTitle();
        });

        return popinContainer;
    }

    /**
     * Créer le DOM de la popin si il n'existe pas
     */
    createIfInexistant() {
        if (this._popinContainer == null) {
            this._popinContainer = this._create();
        }
    }

    /**
     * Restaure le titre originel de la page
     */
    resetPageTitle() {
        if (this._cird._originalTitle != null) {
            document.title = this._cird._originalTitle;
        }
    }

    /**
     * Ferme le CIRD si il est ouvert en mode standalone
     * @param {boolean} fireEvent
     * @return {boolean}
     */
    close(fireEvent = true) {

        if (this._container) {
            this._destroy();

            if (fireEvent) {
                this._cird.fireEvent('popinClosed');
            }

            return true;
        }

        return false;
    }

    /**
     * Supprime la popin du DOM
     * @private
     */
    _destroy() {
        if (this._popinContainer) {
            this._popinContainer.remove();
            this._popinContainer = null;
        }
    }
}