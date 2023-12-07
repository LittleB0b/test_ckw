import {Form} from '../../form/form';

export class ResetPasswordForm extends Form {

    static ID = 'reset-password';

    constructor(container, cird) {
        super(container, cird, ResetPasswordForm.ID, { redirectAfterSubmit: true });

        this.changePageTitle("reset");
    }

    /**
     * Retourne le texte du bouton de validation
     * @return {string}
     * @protected
     */
    _getSubmitButtonText() {
        return 'reset';
    }

    /**
     * Retourne true si le formulaire est correctement renseigné
     * @return {boolean}
     * @protected
     */
    _validateForm() {
        return this._validator.validateEmail(this._fields.email);
    }

    /**
     * Envoie le formulaire
     * @param {Object} data
     * @return {Promise<ApiResult>}
     * @protected
     */
    async _send(data) {

        const apiResult = await this._dataService.resetPassword(data.email);

        if (apiResult.status === 'success' && this.isStandalone()) {
            this._cird.loadRoute('login', {}, {standalone: true, container: this._cird.getRouterContainer()});
        }

        return apiResult;
    }
}
