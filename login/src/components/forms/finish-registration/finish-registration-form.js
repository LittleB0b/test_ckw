import {Form} from '../../form/form';

/**
 * Formulaire qui est affiché lors de la première connexion OAuth
 * pour faire valider à l'utilisateur les conditions d'utilisation
 */
export class FinishRegistrationForm extends Form {

    static ID = 'finish-registration';

    constructor(container, cird) {
        super(container, cird, FinishRegistrationForm.ID);
    }

    /**
     * Retourne le texte du bouton de validation
     * @return {string}
     * @protected
     */
    _getSubmitButtonText() {
        return 'finish';
    }

    /**
     * Initialise le contexte passé au moteur de template avec les données passées en paramètre
     * @param {Object} data
     * @return {Object}
     * @protected
     */
    _createContextFrom(data) {
        return Object.assign(super._createContextFrom(data), {
            tos_link: this._cird.getTermsOfUseLink(),
            custom_tos: this._cird.hasCustomTermsOfUse()
        });
    }

    /**
     * Retourne true si le formulaire est correctement renseigné
     * @return {boolean}
     * @protected
     */
    _validateForm() {
        return this._validator.validateTos(this._fields.tos);
    }

    /**
     * Envoie le formulaire
     * @param {Object} data
     * @return {Promise<ApiResult>}
     * @protected
     */
    _send(data) {

        data = {
            ...data,
            apiMode: 1,
            ...this._cird.getCustomData(['whitemark'])
        }

        return this._api.post('/oauth/register', data, { credentials: 'include' }).then(apiResult => {

            if (apiResult.status === 'success') {
                localStorage.setItem('ckwCird_oauthRegisterId', window.ckwCird_oauthRegisterId);
                location.href = apiResult.data;

                // Sur Chrome la redirection vers l'appli nous laisse sur cette page
                // on doit donc afficher le message qui indique que l'utilisateur peut la fermer
                this._showEndMessage();
            }

            return apiResult;
        });
    }
}
