import {Form} from '../../form/form';

export class ModifyPasswordForm extends Form {

    static ID = 'modify-password';

    constructor(container, cird) {
        super(container, cird, ModifyPasswordForm.ID);

        this.changePageTitle("modifyPassword");
    }

    async initialize(data, internalRouting) {

        const apiResult = await this._api.get('/ajax/checkResetToken', { apiMode: true, ...this._cird.getCustomData(['whitemark', 'token']) });

        if (apiResult && apiResult.status === 'error') {
            this._handleApiError(apiResult);
            return;
        }

        super.initialize(data, internalRouting);
    }

    /**
     * Retourne le texte du bouton de validation
     * @return {string}
     * @protected
     */
    _getSubmitButtonText() {
        return 'validate';
    }

    /**
     * Retourne true si le formulaire est correctement renseigné
     * @return {boolean}
     * @protected
     */
    _validateForm() {

        return this._validator.validatePassword(this._fields.password)
            && this._validator.validatePasswordConfirmation(this._fields.password, this._fields.passwordConfirmation);
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
            ...this._cird.getCustomData(['whitemark', 'token'])
        };

        return this._api.post('/ajax/changePassword', data);
    }
}
