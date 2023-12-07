import {on} from "./utils";
import camelcase from "camelcase";
import 'element-matches';

/**
 * Permet de naviguer entre les différentes pages
 */
export class Router {

    /**
     *
     * @param {CirkwiCird} cird
     * @param {Object} routing
     */
    constructor(cird, routing) {
        this._cird = cird;
        this._contexts = {};
        this._routing = routing;
    }

    /**
     * Défini le contexte d'une page en particulier
     * @param {string} route
     * @param {Object} data
     */
    setContext(route, data) {
        this._contexts[route] = data;
    }

    /**
     * Charge une page à l'aide de sa route
     * @param {string} route
     * @param {boolean} internalRouting
     * @param {HTMLElement} container
     */
    async load(route, internalRouting = false, container = null) {
        if (this._routing.hasOwnProperty(route)) {

            container = container || this._cird.getRouterContainer();
            const component = new this._routing[route](container, this._cird);

            await component.initialize(
                this._contexts[route] || {
                    whitemark: this._cird.getAppId(),
                    ...this._cird._globalContext
                },
                internalRouting
            );

            if (internalRouting) {
                on(component.getContainer(), 'click', this._onClick);
            }
        }
        else {
            throw new Error(`route ${route} does not exists`);
        }
    }

    /**
     * Gère les évènement clic sur les liens en mode standalone
     * @param {MouseEvent} event
     * @private
     */
    _onClick = event => {
        /** @type {HTMLElement} */
        const target = event.target;

        if (target.matches('a[target=angular]')) {
            const href = target.attributes.href.value;
            const page = camelcase(href.substr(1));

            this.load(page, true);
            event.preventDefault();
        }
    }
}
