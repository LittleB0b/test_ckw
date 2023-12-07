import './form.scss';
import { on } from '../../core/utils';

function dashCaseToCamelCase(dash) {
    return dash.replace(/-([a-z])/, function (match, letter) {
        return letter.toUpperCase();
    });
}

export class Form {

    /**
     * @param {HTMLElement} container
     * @param {CirkwiCird} cird
     * @param {string} id
     * @param {boolean} useCaptcha Booléen permettant de charger ou non le Recaptcha v3 de Google
     */
    constructor(container, cird, id, options = { useCaptcha: false, redirectAfterSubmit: false, }) {
        this._container = container;
        this._cird = cird;
        this._id = id;

        this._api = cird._api;
        this._translator = cird._translator;
        this._dataService = cird._dataService;
        this._validator = new FormValidator(this);
        this._errorFormatter = cird._errorFormatter;

        this._useCaptcha = options.useCaptcha;
        this._redirectAfterSubmit = options.redirectAfterSubmit;
    }

    /**
     * Getter de _id
     * @return {string}
     */
    getId() {
        return this._id;
    }

    /**
     * Retourne l'id en camelcase
     * @return {string}
     */
    getName() {
        return dashCaseToCamelCase(this._id);
    }

    /**
     * Retourne si oui ou non on redirige après
     * l'envoie des données (après l'execution de la méthode "_send")
     * @returns {boolean}
     */
    redirectAfterSubmit() {
        return this._redirectAfterSubmit;
    }

    /**
     * Retourne l'élément qui doit contenir le formulaire
     * @return {HTMLElement}
     */
    getContainer() {
        return this._container;
    }

    _transformOAuthAnchors() {
        const anchors = this._container.querySelectorAll('a[target=_oauth]');

        for (const anchor of Array.from(anchors)) {
            const provider = anchor.getAttribute('href');

            anchor.href = 'javascript:void(0)';
            anchor.target = '_self';

            anchor.addEventListener('click', () => {
                this._cird.openOAuth(provider);
            })
        }
    }

    /**
     * Insère le DOM du formulaire
     * @param {Object} context
     * @private
     */
    _render(context) {
        this._container.innerHTML = require(`../forms/${this._id}/${this._id}.hbs`)(context);
        this._transformOAuthAnchors();

        on(this._container.querySelectorAll(".ckw-cird__submit-button"), 'click',event => this.submit(event))
        on(this._container.querySelector(".ckw-cird__cancel-button"), 'click',event => this.cancel(event))
        on(this._container.querySelector(".ckw-cird__back-button"), 'click',event => {
            // On retourne sur la page avec la liste des providers
            this.clearCirkwiLoginForm(event);
            this.showCirdProvidersPage();
        })
    }

    /**
     * Retourne la clé lié à un champ donné
     * @param {HTMLInputElement} field
     * @return {string}
     * @private
     */
    _getFieldKey(field) {
        return field.id.replace(new RegExp(`^ckw-cird__${this._id}__`), '');
    }

    /**
     * Initialise le contexte passé au moteur de template avec les données passées en paramètre
     * @param {Object} data
     * @return {Object}
     * @protected
     */
    _createContextFrom(data) {
        return { ...data };
    }

    /**
     * Initialise le formulaire
     */
    initialize(data, internalRouting) {
        // On indique si le form est load en standalone pour adapter le comportement dans index.js
        this._standalone = internalRouting;

        // Ajout de la propriété "showTitle" dans les données du contexte du template
        // pour permettre de controler l'affichage du titre de chaque template
        data = { ...data, showTitle: this._cird._showTitle };

        this._context = this._createContextFrom(data);
        this._render(this._context);

        if (this._useCaptcha) {
            this._cird._recaptchaService.loadRecaptchaScript();
        } else {
            this._cird._recaptchaService.removeRecaptcha();
        }


        this._fields = {};

        for (const field of this._container.querySelectorAll('input, select')) {
            const key = this._getFieldKey(field);
            this._fields[key] = field;

            // Listeners sur la touche "Entrée" pour trigger la validation du form
            on(field, 'keyup', (event) => {
                if (event.key === 'Enter') {
                    this.submit();
                }
            });
        }

        // Si on clique sur le btn retour sur android
        window?.kwap?.globalEventManager.addListener('back-button', () => {
            // si on est en mode 'cirkwiLast' & qu'on est sur le formulaire de connexion à cirkwi
            if(data.cirkwiLast && this.isCirkwiLoginShowed()){
                // On retourne sur la page avec la liste des providers
                this.clearCirkwiLoginForm();
                this.showCirdProvidersPage();

                return 3; // STOP_PROPAGATION | PREVENT_DEFAULT
            }
        }, -1);
    }


    /**
     * Retourne le texte du bouton de validation
     * @return {string}
     * @protected
     */
    _getSubmitButtonText() { }

    /**
     * Passe le formulaire dans l'état en cours de chargement et vice-versa
     * @param {boolean} loading
     */
    setLoading(loading) {
        // Si on redirige après l'envoie des données, on ne change pas le bouton
        if (this.redirectAfterSubmit() && !loading) return;
        const submitButtons = this._container.querySelectorAll('.ckw-cird__submit-button');

        for (const button of Array.from(submitButtons)) {
            button.textContent = this._translator.translate(loading ? 'submitting' : this._getSubmitButtonText());
        }
    }

    /**
     * Retourne la valeur du mode standalone du form
     * @returns {boolean}
     */
    isStandalone() {
        return this._standalone;
    }

    /**
     * Change le titre de la page en fonction du formulaire
     * @param {string} traductionKey
     */
    changePageTitle(traductionKey) {
        if (this._cird._originalTitle != null) {
            document.title = this._translator.translate(traductionKey);
        }
    }

    /**
     * Retourne l'élement utilisé pour afficher les erreurs d'un champ donné
     * @param {HTMLInputElement} field
     * @return {HTMLElement}
     * @private
     */
    _getErrorElement(field) {
        const key = this._getFieldKey(field);
        return this._container.querySelector(`.ckw-cird__error[data-target=${key}]`);
    }

    /**
     * Cache les erreurs affichés par le formulaire
     * @private
     */
    _resetErrors() {

        for (const field of Object.values(this._fields)) {
            field.style.border = '1px solid #404040';
            if (field != null) {
                return this._getErrorElement(field).textContent = '';
            }
        }
    }

    /**
     * Affiche une erreur dans le formulaire
     * @param {string|string[]} error
     * @param {HTMLInputElement[]} fields
     * @param {HTMLElement|null} scrollTarget
     */
    showError(error, fields = null, scrollTarget = null) {

        const formattedError = this._errorFormatter.getMessage(error);

        if (this._fields) {
            let fieldBorder = true;

            if (fields == null) {
                fieldBorder = false;
                fields = [Object.values(this._fields)[0]];
            }

            const errorEl = this._getErrorElement(fields[0]);
            scrollTarget = scrollTarget || errorEl;

            errorEl.innerHTML = formattedError;

            if (fieldBorder) {
                for (const field of fields) {
                    field.style.border = '1px solid red';
                }
            }

            scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        else {
            this._container.innerHTML = `<div class="ckw-cird__form"><div class="ckw-cird__error">${this._errorFormatter.getMessage(error)}</div></div>`;
        }
    }

    /**
     * Retourne true si le formulaire est correctement renseigné
     * @return {boolean}
     * @protected
     */
    _validateForm() {
        return true;
    }

    /**
     * Retourne un objet contenant les valeurs du formulaire
     * @return {Object}
     * @private
     */
    _getFormData() {

        const data = {};

        for (const field of Object.values(this._fields)) {
            data[field.name] = field.value;
        }

        return data;
    }

    /**
     * Active l'évènement success
     * @param {ApiResult} apiResult
     * @protected
     */
    _fireSuccessEvent(apiResult) {
        this._cird.fireEvent('formSuccess', { apiResult, form: this });
        this._cird.fireEvent('cird-submit', { apiResult }, true);
    }

    /**
     * Active l'évènement error
     * @param {ApiResult} apiResult
     * @protected
     */
    _fireErrorEvent(apiResult) {
        this._cird.fireEvent('formError', { apiResult, form: this });
    }

    /**
     * Verrouille le formulaire
     * @return {boolean}
     * @private
     */
    _lock() {
        return this._cird.lock();
    }

    /**
     * Déverouille le formulaire
     * @private
     */
    _unlock() {
        this._cird.unlock();
    }

    _handleApiError(apiResult) {
        if (typeof apiResult.error === 'string') {
            this.showError(apiResult.error);
        }
        else if (typeof apiResult.errorCode === 'string') {
            this.showError(apiResult.errorCode);
        }
        else {
            this.showError([JSON.stringify(apiResult)]);
        }

        this._fireErrorEvent(apiResult);
        console.error(apiResult);
    }

    /**
     * Soumet le formulaire
     */
    submit() {

        if (!this._lock()) {
            return;
        }

        try {
            this._resetErrors();
            this.setLoading(true);

            if (this._validateForm()) {
                this._send(this._getFormData())
                    .then(apiResult => {
                        if (apiResult.status === 'error') {
                            this._handleApiError(apiResult);
                        } else if (apiResult) {
                            this._fireSuccessEvent(apiResult);
                            this._cird._recaptchaService.removeRecaptcha();
                        }
                        this.setLoading(false);
                    })
                    .finally(() => {
                        this._unlock();
                    });
            } else {
                this.setLoading(false);
                this._unlock();
            }
        } catch (e) {
            this.setLoading(false);
            this._unlock();
            throw e;
        }
    }

    /**
     * @param {MouseEvent} event
     */
    cancel(event) {
        if (window.kwap || this._standalone) {
            event.preventDefault();

            if (this._standalone) {
                this._cird.close();
            }
        }
    }

    /**
     * Permet de savoir si le formulaire de login sur cirkwi est afficher
     * @returns {boolean}
     */
    isCirkwiLoginShowed(){
        const cirkwiLoginForm = this._container.querySelector('.ckw-cird__login-form');

        return cirkwiLoginForm && cirkwiLoginForm.style.display !== 'none'
    }

    /**
     * Permet de clear le formulaire de connexion cirkwi
     */
    clearCirkwiLoginForm(){
        this._container.querySelector('#ckw-cird__login__email').value = '';
        this._container.querySelector('#ckw-cird__login__password').value = '';
    }

    /**
     * Permet d'afficher la page avec les providers
     */
    showCirdProvidersPage() {
        this._container.querySelector('.ckw-cird__login-form').style.display = 'none';
        this._container.querySelector('.ckw-cird__login-providers').style.display = '';
    }

    /**
     * Envoie le formulaire
     * @param {Object} data
     * @return {Promise<ApiResult>}
     * @protected
     */
    _send(data) { }

    _showEndMessage() {
        setTimeout(() => {
            const { body } = document;

            body.innerHTML = this._translator.translate('you_can_now_leave');
            body.style.font = '1.2em/1.5 sans-serif';
            body.style.textAlign = 'center';
            body.style.marginTop = '3em';
        }, 1000);
    }
}

export class FormValidator {

    /**
     * @param {Form} form
     */
    constructor(form) {
        this._form = form;
    }

    /**
     * Retourne true si l'email est correctement renseigné
     * @param {HTMLInputElement} emailField
     * @return {boolean}
     */
    validateEmail(emailField) {

        const email = emailField.value;

        if (email.length <= 0 || !email.includes('@')) {
            this._form.showError('emailMissing', [emailField]);
            return false;
        }

        if (email.length > 240) {
            this._form.showError('emailTooLong', [emailField]);
            return false;
        }

        return true;
    }

    /**
     * Retourne true si le mot de passe est correctement renseigné
     * @param {HTMLInputElement} passwordField
     * @return {boolean}
     */
    validatePassword(passwordField) {

        const password = passwordField.value;

        if (password.length === 0) {
            this._form.showError('passwordMissing', [passwordField]);
            return false;
        }

        if (password.length < 5) {
            this._form.showError('minLengthPassword', [passwordField]);
            return false;
        }

        if (password.length > 100) {
            this._form.showError('passwordTooLong', [passwordField]);
            return false;
        }

        return true;
    }

    /**
     * Retourne true si la confirmation de mot de passe est correctement renseignée
     * @param {HTMLInputElement} passwordField
     * @param {HTMLInputElement} confirmationField
     * @return {boolean}
     */
    validatePasswordConfirmation(passwordField, confirmationField) {

        const password = passwordField.value;
        const confirmation = confirmationField.value;

        if (password !== confirmation) {
            this._form.showError('missmatchPassword', [confirmationField, passwordField], passwordField);
            return false;
        }

        return true;
    }

    /**
     * Retourne true si les cgu sont acceptés sinon affiche un message d'erreur et retourne false
     * @param {HTMLInputElement} tosCheckbox
     * @return {boolean}
     */
    validateTos(tosCheckbox) {

        if (!tosCheckbox.checked) {
            this._form.showError('cguMissing', [tosCheckbox]);
            return false;
        }

        return true;
    }

    /**
     * Retourne true si le nom de la structure est correctement renseigné
     * @param {HTMLInputElement} organizationNameField
     * @return {boolean}
     */
    validateOrganizationName(organizationNameField) {

        const organizationName = organizationNameField.value;

        if (organizationName.length === 0) {
            this._form.showError('organizationNameMissing', [organizationNameField]);
            return false;
        }

        if (organizationName.length > 100) {
            this._form.showError('organizationNameTooLong', [organizationNameField]);
            return false;
        }

        return true;
    }

    /**
     * Retourne true si le type de la structure est correctement selectionné
     * @param {HTMLInputElement} organizationTypeField
     * @return {boolean}
     */
    validateOrganizationType(organizationTypeField) {

        const organizationType = organizationTypeField.value;

        if (organizationType === "") {
            this._form.showError('organizationTypeMissing', [organizationTypeField]);
            return false;
        }

        return true;
    }

    /**
     * Retourne true si le site internet est correctement renseigné
     * @param {HTMLInputElement} websiteField
     * @return {boolean}
     */
    validateWebsite(websiteField) {

        const website = websiteField.value;

        if (!website.match(/((http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))?/g)) {
            this._form.showError('websiteMalformed', [websiteField]);
            return false;
        }

        return true;
    }

    /**
     * Défini la valeur de la checkbox en fonction de son état
     * @param {HTMLInputElement} proCheckbox
     */
    validatePro(proCheckbox) {
        if (!proCheckbox.checked) {
            proCheckbox.value = 'off'
        }
        return proCheckbox
    }

    validateNumAddress(numAddressField) {
        if (!numAddressField.value) {
            this._form.showError('errorWithField', [numAddressField])
            return false
        }
        return true
    }

    validateNameAddress(nameAddressField) {
        const str = nameAddressField.value
        if (!nameAddressField.value || str.length < 5) {
            this._form.showError('errorWithField', [nameAddressField])
            return false
        }
        return true
    }

    validateCpAdress(cpAddressField) {
        const cpLength = cpAddressField.value
        if (!cpAddressField.value || cpLength < 3) {
            this._form.showError('errorWithField', [cpAddressField])
            return false
        }
        return true
    }

    validateCity(cityField) {
        const str = cityField.value
        if (!cityField.value || str.length < 2) {
            this._form.showError('errorWithField', [cityField])
            return false
        }
        return true
    }

    validateCountry(countryField) {
        if (!countryField.value) {
            this._form.showError('errorWithField', [countryField])
            return false
        }
        return true
    }

    /**
     * Retourne true si tout les champs (non spécifique) du formulaire sont correctement renseignés
     * @param {HTMLInputElement} otherField
     * @returns {boolean}
     */
    validateOtherFields(otherField) {
        if (!otherField.value) {
            this._form.showError('errorWithField', [otherField])
            return false
        }
        return true
    }
}
