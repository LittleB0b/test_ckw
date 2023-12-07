import './prelogin.scss';
import {Form} from '../../form/form';
import {on} from "../../../core/utils";

/**
 * Formulaire qui peut être affiché lorsque la connexion utilisateur est requise
 * Gère uniquement le clic sur les boutons de connexion via OAuth
 */
export class PreloginForm extends Form {

    static ID = 'prelogin';

    constructor(container, cird, id = PreloginForm.ID) {
        super(container, cird, id, { useCaptcha: true });
    }

    /**
     * Ajoute les listeners sur les boutons de connexion oauth
     * @param data
     */
    initialize(data, internalRouting) {
        const appleSignIn = this._cird.getPlatform() === 'ios';
        // Utilisation de !! pour transformer "undefined" en booléen
        const isFFR = !!(data.whitemark && ['board_ffrandonnee', 'com.cirkwi.marando'].includes(data.whitemark));
        // Pour pouvoir se connecter à Microsoft il faut que l'option soit activée et qu'on ne soit pas sur le board FFR ou l'appli MaRando
        const loginWithMicrosoft = !isFFR && data.microsoftSignIn;

        super.initialize({ ...data, appleSignIn, loginWithMicrosoft }, internalRouting);

        const oauthButtonIds = [
            'ckw-cird__login__facebook',
        ];

        if (appleSignIn) {
            oauthButtonIds.push('ckw-cird__login__apple');
        }
        else {
            oauthButtonIds.push('ckw-cird__login__google');
        }

        if (data.ffrSignIn) {
            oauthButtonIds.push('ckw-cird__login__sgvf');
        }

        if (loginWithMicrosoft) {
            oauthButtonIds.push('ckw-cird__login__microsoft');
        }

        for (const buttonId of oauthButtonIds) {
            const button = document.getElementById(buttonId);

            if (button) {
                on(button, 'click', this._handleOauthLogin);
            }
            else {
                console.error(`unable to find button with id ${buttonId}`);
            }
        }
    }

    /**
     * Gère le clic sur un bouton de connexion oauth
     * @param {MouseEvent} event
     * @private
     */
    _handleOauthLogin = (event) => {
        const target = event.currentTarget;
        const provider = target.id.replace(/^.+__([a-z]+)$/, '$1');

        this._cird.openOAuth(provider);
    }

    /**
     * Effectue une connexion via un cookie passé en paramètre
     * @param {string} setCookie
     * @param {string} oauthLogout
     * @param {string} oauthProvider
     */
    loginFromOAuth(setCookie, oauthLogout, oauthProvider) {
        this._dataService.getCookieManager().readSetCookieHeader(setCookie);

        this._dataService.setOAuthLogout(oauthLogout);
        this._dataService.setOAuthProvider(oauthProvider);

        this._dataService.getUserData().then(userData => {

            // On ajoute le provider aux données de l'user
            userData.oauthProvider = oauthProvider;

            this._fireSuccessEvent({data: userData});
        });
    }
}
