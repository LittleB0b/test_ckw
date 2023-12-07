import {Form} from '../../form/form';
import {on} from '../../../core/utils';

/**
 * Formulaire qui est affiché lors de la première connexion OAuth
 * pour faire valider à l'utilisateur les conditions d'utilisation
 */
export class BindAccountForm extends Form {

    static ID = 'bind-account';

    constructor(container, cird) {
        super(container, cird, BindAccountForm.ID);
    }

    initialize(data, internalRouting) {
        super.initialize(data, internalRouting);

        on(this._container.querySelector('.ckw-cird__bind-account__reset-password'), 'click', this.resetPassword.bind(this));
    }

    /**
     * Retourne le texte du bouton de validation
     * @return {string}
     * @protected
     */
    _getSubmitButtonText() {
        return 'submitBind';
    }

    /**
     * Retourne true si le formulaire est correctement renseigné
     * @return {boolean}
     * @protected
     */
    _validateForm() {
        return this._validator.validatePassword(this._fields.password);
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

        return this._api.post('/oauth/bind', data, { credentials: 'include' }).then(apiResult => {

            if (apiResult.status === 'success') {
                localStorage.setItem('ckwCird_oauthBindId', window.ckwCird_oauthBindId);
                location.href = apiResult.data;

                // Sur Chrome la redirection vers l'appli nous laisse sur cette page
                // on doit donc afficher le message qui indique que l'utilisateur peut la fermer
                this._showEndMessage();
            }

            return apiResult;
        });
    }

    resetPassword() {

        if (confirm(this._translator.translate('confirmPasswordReset'))) {
            return this._dataService.resetPassword(this._context.email, true);
        }
    }
}
