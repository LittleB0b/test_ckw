import { PreloginForm } from "../prelogin/prelogin-form";
import { on } from "../../../core/utils";

export class LoginForm extends PreloginForm {

    static ID = 'login';

    constructor(container, cird) {
        super(container, cird, LoginForm.ID);

        this.changePageTitle("connect");
    }

    initialize(data, internalRouting) {
        // Utilisation de !! pour transformer "undefined" en booléen
        const isFFR = !!(data.whitemark && ['board_ffrandonnee', 'com.cirkwi.marando'].includes(data.whitemark));
        // Pour pouvoir se connecter à Microsoft il faut que l'option soit activée et qu'on ne soit pas sur le board FFR ou l'appli MaRando
        const loginWithMicrosoft = !!(!isFFR && data.microsoftSignIn);
        super.initialize({ ...data, loginWithMicrosoft }, internalRouting);

        const loginWithCirkwiBtn = this._container.querySelector('#ckw-cird__login__cirkwi');

        if (loginWithCirkwiBtn) {
            on(loginWithCirkwiBtn, 'click', () => {
                this._container.querySelector('.ckw-cird__login-form').style.display = '';
                this._container.querySelector('.ckw-cird__login-providers').style.display = 'none';
            });
        }
    }

    /**
     * Retourne le texte du bouton de validation
     * @return {string}
     * @protected
     */
    _getSubmitButtonText() {
        return 'connect';
    }

    /**
     * Retourne true si le formulaire est correctement renseigné
     * @return {boolean}
     * @protected
     */
    _validateForm() {

        return this._validator.validateEmail(this._fields.email)
            && this._validator.validatePassword(this._fields.password);
    }


    /**
     * Vérifie si le captcha est valide
     * @returns {Promise<boolean>}
     * @protected
     */
    _validateCaptcha() {

        // Si on ne peut pas charger le recaptcha, on retourne une Promise à "true"
        // puisqu'on ne va pas faire la vérification du recaptcha
        if (!this._cird._recaptchaService.canLoadRecaptcha()) {
            return Promise.resolve(true);
        }

        /** ==========================================================================
         *
         * ------------------ Code récupéré dans la doc de Google --------------------
         * Celui ci permet de créer la fonction `grecaptcha.ready()` si elle n'est pas
         * présente au moment du début de l'exécution de cette méthode.
         * ---------------------------------------------------------------------------
         *
         * @see {@link https://developers.google.com/recaptcha/docs/loading}
         *
         * How this code snippet works:
         * This logic overwrites the default behavior of `grecaptcha.ready()` to
         * ensure that it can be safely called at any time. When `grecaptcha.ready()`
         * is called before reCAPTCHA is loaded, the callback function that is passed
         * by `grecaptcha.ready()` is enqueued for execution after reCAPTCHA is
         * loaded.
         */

        if (typeof grecaptcha === 'undefined') {
            grecaptcha = {};
        }
        grecaptcha.ready = function (cb) {
            if (typeof grecaptcha === 'undefined') {
                // window.__grecaptcha_cfg is a global variable that stores reCAPTCHA's
                // configuration. By default, any functions listed in its 'fns' property
                // are automatically executed when reCAPTCHA loads.
                const c = '___grecaptcha_cfg';
                window[c] = window[c] || {};
                (window[c]['fns'] = window[c]['fns'] || []).push(cb);
            } else {
                cb();
            }
        }
        // ===========================================================================

        /**
         * Envoie une requête à l'API Cirkwi pour valider le token du captcha
         * @param {string} token
         * @returns {Promise<ApiResult>}
         */
        const postCaptcha = (token) => {
            return this._api.post('/ajax/captcha', {
                '_g_recaptcha_response': token,
                '_g_recaptcha_version': 3
            });
        };

        return new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                grecaptcha.execute(ENV_FILE.RECAPTCHA_V3_PUBLIC_KEY, {
                    action: "signinCIRD"
                })
                    .then(postCaptcha)
                    .then(apiResult => resolve(apiResult.status === 1))
                    .catch(reject);
            });
        });
    }

    /**
     * Envoie le formulaire
     * @param {Object} data
     * @return {Promise<ApiResult>}
     * @protected
     */
    async _send(data) {

        const isRecaptchaValid = await this._validateCaptcha();

        if (!isRecaptchaValid) {
            this.showError('wrongCaptcha');
            return false;
        }

        const { cirkwiToolId } = this._cird.getCustomData(['cirkwiToolId']);

        // @exception
        // On envoie un champ en plus lors de la connexion sur Cirkwi
        if (this._cird.getCustomData(['whitemark']).whitemark === 'cirkwi' && typeof cirkwiToolId !== 'undefined') {
            data.mb_cdf_id_source = cirkwiToolId;
        }

        const loginResponse = await this._api.post('/login_check', data);

        if (loginResponse.status === 'error') {
            if (loginResponse.statusCode === 400) {
                this.showError('wrongLogin', [this._fields.email, this._fields.password]);
            } else {
                this.showError('unknownError', [this._fields.email]);
            }

            return false;
        }

        const userData = await this._dataService.getUserData();

        return { data: userData };
    }
}
