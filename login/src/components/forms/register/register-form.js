import {Form} from '../../form/form';

export class RegisterForm extends Form {

    static ID = 'register';

    constructor(container, cird) {
        super(container, cird, RegisterForm.ID, { useCaptcha: true, redirectAfterSubmit: true });

        this.changePageTitle("register");
    }

    /**
     * Initialise les fonctionnalités propres au formulaire d'inscription
     */
    initialize(data, internalRouting){
        super.initialize({...data}, internalRouting);

        // Listener sur la checkbox "Je suis un professionnel" du register-form pour afficher les inputs supplémentaires
        const proCheckbox = this._container.querySelector('#ckw-cird__register__pro');
        const proRegisterInputs = this._container.querySelector('.ckw-cird__register-input-pro');

        proCheckbox.addEventListener('click', function(event) {
            proRegisterInputs.style.display = proRegisterInputs.style.display === 'none' ? 'block' : 'none';
            proCheckbox.value = proCheckbox.value === 'off' ? 'on' : 'off';
        });

        // Récupère la liste des enseignes de Cirkwi pour l'insérer dans le select du form d'inscription pro
        this._api.get('/api/kwap/getEnseignes', data).then(apiResult => {
            var organizationSelectInput = document.querySelector('#ckw-cird__register__organizationType');

            apiResult.data.enseignes.forEach(enseigne => {
                var option = new Option(this._translator.translate(`listStructure.${enseigne}`), enseigne);
                organizationSelectInput.appendChild(option);
            });
        });
    }

    /**
     * Retourne le texte du bouton de validation
     * @return {string}
     * @protected
     */
    _getSubmitButtonText() {
        return 'register';
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

        return this._validator.validateEmail(this._fields.email)
            && this._validator.validatePassword(this._fields.password)
            && this._validator.validatePasswordConfirmation(this._fields.password, this._fields.passwordConfirmation)
            && this._validator.validateTos(this._fields.tos)
            && (this._fields.pro.checked ?
                this._validator.validateOrganizationName(this._fields.organizationName)
                && this._validator.validateOrganizationType(this._fields.organizationType)
                && this._validator.validateWebsite(this._fields.website) : true);
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
            ...this._cird.getCustomData(['whitemark']),
            FromKWAP: 'yes',
            needToBeNeutral: true
        }

        return this._api.post('/ajax/faireInscription', data, {query: {withoutAdress: 1}}).then(apiResult => {
            // if (data['erreur'] != undefined) {
            //     this.showError('accountAlreadyExist', [this._fields.email]);
            //     return false;
            // }

            if (apiResult.status === 'error') {

                // Correction temporaire il faudrait harmoniser la gestion des erreurs (retourner un code d'erreur au lieu d'un texte)
                if (apiResult.message) {
                    this.showError(apiResult.message, [ this._fields.email ]);
                } else if (apiResult.statusCode === 400 && !apiResult.message) {
                    this.showError('accountAlreadyExist', [ this._fields.email ]);
                } else {
                    this.showError('unknownError', [ this._fields.email ]);
                }

                return false;
            }

            const cgu_valeurs = {
                cdf_CGUInput: true,
                page: ''
            };

            return this._api.post('/cgu/accept', cgu_valeurs);
        });
    }
}
