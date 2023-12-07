import { Form } from "../../form/form";
import {ProfileManagementForm} from '../profile-management/profile-management-form';
import "./sgvf-profile-management.scss";

/**
 * Formulaire qui permet la gestion du compte utilisateur (changement mdp, adresse mail)
 */
export class SgvfProfileManagementForm extends ProfileManagementForm {
    static NAME = "sgvf-profile-management";

    constructor(container, cird) {
        super(container, cird, SgvfProfileManagementForm.NAME);
        this.prefix = "ckw-cird__sgvf-profile-management__";
    }

    /**
     *
     * Initialise le composant avec ses fonctionnalités propres
     */
    initialize(data, internalRouting) {

        data.sgvfProfileUrl = `${this._api._cirkwiOrigin}/${this._api._language}/oauth/sgvf/account`;
        Form.prototype.initialize.call(this, {...data}, internalRouting);

        this._retrieveData();
        this._sendingImage();
        this._initAccountRemovalButton();
    }

    /**
     * Retourne le texte du bouton de validation
     * @return {string}
     * @protected
     */
    _getSubmitButtonText() {
        return 'save';
    }

    /**
     * Récupère toute les informations concernant l'utilisateur et pré-remplis les champs
     */
    _retrieveData() {

        this._api
            .get("/api/kwap/profileManagament", null, {
                cookies: true,
                credentials: "include",
            })
            .then((apiResult) => {

                if (apiResult.data) {
                    for (const [responseKey, responseValue] of Object.entries(apiResult.data)) {
                        this._loadField(responseKey, responseValue);
                    }
                }
            });
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
     * Envoie le formulaire
     * @param {Object} data
     * @return {Promise<ApiResult>}
     * @protected
     */
    _send(data) {

        return this._api.post("/api/kwap/update-user-image", data, {
            cookies: true,
            credentials: "include",
        });
    }


    /**
     * Permet d'afficher le loading de l'image de profil
     */
    showImageProfileLoading(){
        document.querySelector('#ckw-cird__sgvf-profile-management__image').style.display = "none";
        document.querySelector('.ckw-cird__sgvf-profile-management__image-loading').style.display = "flex";
    }

    /**
     * Permet de cacher le loading de l'image de profil
     */
    hideImageProfileLoading(){
        document.querySelector('#ckw-cird__sgvf-profile-management__image').style.display = "block";
        document.querySelector('.ckw-cird__sgvf-profile-management__image-loading').style.display = "none";
    }
}
