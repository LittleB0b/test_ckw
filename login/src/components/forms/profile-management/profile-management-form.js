import {off, on, once, resizeAndCompressImage, showAlert} from "../../../core/utils";
import { Form } from "../../form/form";
import { createPopper } from "@popperjs/core";

/**
 * Formulaire qui permet la gestion du compte utilisateur (changement mdp, adresse mail)
 */
export class ProfileManagementForm extends Form {
  static NAME = "profile-management";

  constructor(container, cird, id = ProfileManagementForm.NAME) {
    super(container, cird, id);
    this.prefix = "ckw-cird__profile-management__";
  }

  /**
   *
   * Initialise le composant avec ses fonctionnalités propres
   */
  initialize(data, internalRouting) {
    super.initialize({...data}, internalRouting);
    this._retrieveData();
    this._manageEvent();
    this._sendingImage();
    this._initAccountRemovalButton();
    this._changePassword(this, this._fields, this._api, this._validator, this._successPwdForm);

    if (this._cird._mode === 'unlimited' || this._cird.isInAppMode()) {
      this._hideOffer(this._cird._mode);
    }
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
    /**
     * Variable
     */
    let userTypeOrganization;
    let statusCheckbox = [];

    this._api
        .get("/api/kwap/profileManagament", null, {
          cookies: true,
          credentials: "include",
        })
        .then((apiResult) => {
          let idUser;
          const organizationSelect = document.querySelector(
              `#${this.prefix}organizationType`
          );
          const countrySelect = document.querySelector(
              `#${this.prefix}countryList`
          );
          const countrySelectFac = document.querySelector(
              `#${this.prefix}countryListFac`
          );

          for (const [responseKey, responseValue] of Object.entries(
              apiResult.data
          )) {
            if (responseKey === "userPack") {
              this._loadingOffer(responseValue);
            }

            if (responseKey === "userPro") {
              statusCheckbox["pro"] = responseKey;
              statusCheckbox["proStatus"] = responseValue;
            }

            if (responseKey === "billing") {
              statusCheckbox["billing"] = responseKey;
              statusCheckbox["billingStatus"] = responseValue;
            }

            if (responseKey === "id") {
              idUser = responseValue;
            }

            if (responseKey === "infoCountry") {
              responseValue.country.forEach((item) => {
                if (item.pays === responseValue.userCountry) {
                  var optionCountry = new Option(
                      item.pays,
                      item.code_pays,
                      false,
                      true
                  );
                  countrySelect.appendChild(optionCountry);
                } else {
                  var optionCountry = new Option(item.pays, item.code_pays);
                }

                if (item.pays === responseValue.factCountry) {
                  var optionCountryFac = new Option(
                      item.pays,
                      item.code_pays,
                      false,
                      true
                  );
                  countrySelectFac.appendChild(optionCountryFac);
                } else {
                  var optionCountryFac = new Option(item.pays, item.code_pays);
                }

                countrySelect.appendChild(optionCountry);
                countrySelectFac.appendChild(optionCountryFac);
              });
            }

            if (responseKey === "organizationType") {
              this.userTypeOrganization = responseValue.userOrganization;
              for (const item of responseValue.organizationList) {
                var optionOrga = new Option(
                    this._translator.translate(`listStructure.${item}`),
                    item
                );
                organizationSelect.appendChild(optionOrga);
              }
            }

            this._loadField(responseKey, responseValue);
          }
          this._selectedOption(this.userTypeOrganization);

          this._buttonIdListener(idUser);
          this._checkedInput(statusCheckbox);
        });
  }

  /**
   * Cache la partie Offre
   */
  _hideOffer() {
    let offerSection = document.querySelector(`#${this.prefix}userPack`);
    offerSection.style.display = "none";

    let offerBtn = document.querySelector(`#${this.prefix}btnOffer`)
    offerBtn.style.display = "none";
  }

  /**
   * Charge le contenu du mail lors de la suppression du compte
   */
  _initAccountRemovalButton(){
    const button = document.querySelector('.ckw-cird__send-account-removal-request');

    off(button, 'click', this._onRemovalButtonClick);
    on(button, 'click', this._onRemovalButtonClick);

    button.textContent = this._translator.translate('deleteAccount');
    this._accountRemovalButton = button;
  }

  _onRemovalButtonClick = () => {
      void this._deleteAccount(this._accountRemovalButton);
  };

  /**
   * Envoie une demande de suppression de compte
   * @param {HTMLElement} button
   * @return {Promise<ApiResult|null>}
   * @private
   */
  async _sendDeleteAccountRequest(button) {
    button.textContent = this._translator.translate('sendingAccountRemovalRequest');
    button.style.pointerEvents = 'none';

    try {
      const res = await this._api.post("/api/user/send-account-removal-email", null, {
        cookies: true,
      });

      const success = res.status === 'success';

      if (success) {
        showAlert(this._translator.translate('acknowledgeAccountRemoval'));
      } else {
        showAlert(this._translator.translate('unknownError'));
      }

      return res;
    }
    catch (e) {
      showAlert(this._translator.translate('unknownError'));
    }
    finally {
      button.textContent = this._translator.translate('deleteAccount');
      button.style.pointerEvents = 'auto';
    }
  }

  /**
   * Envoie une demande suppression de compte (avec une confirmation préalable)
   * @param {HTMLElement} button
   * @return {Promise<ApiResult|null|false>}
   * @private
   */
  async _deleteAccount(button){
    let confirmed;

    if (window.kwap) {
      confirmed = await window.kwap.notificationService.confirm(this._translator.translate('confirmAccountRemoval'), {
        title: this._translator.translate('accountRemovalTitle'),
        modal: true,
        closeButton: true,
      });
    }
    else {
      confirmed = window.confirm(this._translator.translate('confirmAccountRemoval'));
    }

    if (confirmed) {
      return this._sendDeleteAccountRequest(button);
    }

    return false;
  }

  /**
   * Charge la partie offre avec l'intitulé correspondant au pack
   * @param {Integer} value
   */
  _loadingOffer(value) {
    let userPack = document.querySelector(`#${this.prefix}userPack`);
    let sectionOffer = document.createElement("p");
    sectionOffer.innerHTML = this._translator.translate(
        `userPack.${value.id_pack}`
    );
    userPack.appendChild(sectionOffer);
  }

  /**
   * Selectionne l'option qui correspond à au type d'organisation de l'utilisateur
   * @param {Integer} userValue
   */
  _selectedOption(userValue) {
    for (const orga of this._fields["organizationType"]) {
      if (orga.value === userValue) {
        orga.selected = true;
      }
    }
  }

  /**
   * Affichage des parties Pro et Facturation en fonction des données de l'utilisateur
   * @param {String} state
   */
  _checkedInput(state) {
    if (state["pro"] === "userPro") {
      let proSection = document.querySelector(`#${this.prefix}proSection`)
      this._fields["professionnel"].checked = parseInt(state.proStatus) === 1;
      proSection.style.display = this
          ._fields["professionnel"].checked
          ? proSection.classList.remove('hide-section')
          : proSection.classList.add('hide-section');
    }

    if (state["billing"] === "billing") {
      let billingSection = document.querySelector(`#${this.prefix}billingSection`)
      this._fields["billing"].checked = state["billingStatus"] ? false : true;
      billingSection.style.display =
          this._fields["billing"].checked
              ? (billingSection.classList.add('hide-section'), this._handleAsterisk('hide'))
              : (billingSection.classList.remove('hide-section'), this._handleAsterisk('show'));
    }
  }

  /**
   * Selectionne et charge les différents champs en fonction de la clé et de la valeur passé en paramètre
   * @param {*} key
   * @param {*} data
   */
  _loadField(key, data) {
    let selectedElement;

    selectedElement = document.querySelectorAll(`[id*=${key}`);

    selectedElement.forEach((elementDOM) => {
      if (elementDOM.nodeName === "IMG") {
        elementDOM.src = data;
      }
      elementDOM.value = data;
    });
  }

  /**
   * Charge l'id de l'utilisateur et transforme le bouton en input selectionnable
   * @param {Integer} data
   */
  _buttonIdListener(data) {
    let idButton = document.querySelector(`#${this.prefix}id`);
    once(idButton, "click", () => {
      let replaceElement = document.createElement("input");
      replaceElement.className = "ckw-cird__btn_id ckw-cird__button_secondary";
      replaceElement.readOnly = true;
      replaceElement.style.textAlign = "center";
      replaceElement.value = data;
      idButton.replaceWith(replaceElement);
      replaceElement.select();
    });
  }

  /**
   * Gère les différents évenement du formulaire
   */
  _manageEvent() {

    // Partie pro
    let tltpPro = document.querySelector(`#${this.prefix}tltp_pro`);
    let tltpProTxt = document.querySelector(`#${this.prefix}tltp_pro-txt`);

    // Partie public
    let tltpPublic = document.querySelector(`#${this.prefix}tltp_public`);
    let tltpTxt = document.querySelector(`#${this.prefix}tltp_public-txt`);

    // Gère l'affichage des tooltips
    this._tooltipProvider(tltpPublic, tltpTxt);
    this._tooltipProvider(tltpPro, tltpProTxt);

    // Partie pro

    let proCheckbox = document.querySelector(`#${this.prefix}professionnel`);
    let proSection = document.querySelector(`#${this.prefix}proSection`);

    // Gère l'affichage de la partie pro
    // Si la checkbox est cochée, on affiche la partie "Mes informations professionnel" sinon on la cache
    proCheckbox.addEventListener("click", () => {
      if(proCheckbox.checked){
        proSection.classList.remove('hide-section')
      } else {
        proSection.classList.add('hide-section')
      }
    });

    // Partie facturation

    let billingCheckbox = document.querySelector(`#${this.prefix}billing`);
    let billingSection = document.querySelector(
        `#${this.prefix}billingSection`
    );

    // Gère l'affichage de la partie facturation
    // Si la checkbox n'est pas cochée, on affiche la partie "Mon adresse de facturation" sinon on la cache
    billingCheckbox.addEventListener("click", () => {
      if(billingCheckbox.checked){
        billingSection.classList.add('hide-section')
        this._handleAsterisk('hide')
      } else {
        billingSection.classList.remove('hide-section')
        this._handleAsterisk('show')
      }
    });

    // Partie mot de passe
    // Gère l'affichage du formulaire de changement de mot de passe
    this._togglePwdForm();
  }


  /**
   * Affiche ou non les asterisques en fonction de l'état donné en paramètre
   * @param {String} state
   */
  _handleAsterisk(state)
  {
    let addressField = document.querySelector('.ckw-cird__address')

    for (const element of addressField.children)
    {
      let asterisk = element.querySelector('.ckw-cird__asterisk');
      if (asterisk)
      {
        switch (state)
        {
          case 'hide':
            asterisk.classList.add('ckw-cird__hide')
            break;

          case 'show':
            asterisk.classList.remove('ckw-cird__hide')
            break;
        }
      }
    }
  }

  /**
   * Selectionne les différents champs du formulaire de changement de mot de passe
   * @returns {HTMLElement} // Tableau comportant les différents champs du formulaire de change de mot de passe
   */
  _getFormField(){
    return {
      passwordButton : document.querySelector(`#${this.prefix}btn_change_pwd`),
      btnClose : document.querySelector(`#${this.prefix}btn_close`),
      sectionPwd : document.querySelector(`.ckw-cird__change-password`),
      textAlert : document.querySelector('.ckw-cird__alert-success')
    }
  }


  /**
   * Gère le changement d'état du formulaire de mot de passe
   */
  _togglePwdForm(){

    // Variable
    let formField = this._getFormField()


    // Ouvre le formulaire et retire le message de succès si il a été affiché
    formField.passwordButton.addEventListener("click", () => {
      this._openPwdForm(formField);
    })

    // Ferme le formulaire
    formField.btnClose.addEventListener("click", () => {
      this._closePwdForm(formField)
    })
  }


  /**
   * Gère l'evenement d'ouverture du formulaire de changement de mot de passe
   * @param {HTMLElement} formField
   */
  _openPwdForm(formField){
    document.querySelector('.ckw-cird__alert-success').classList.toggle('ckw-cird__hide', true);
    formField.sectionPwd.classList.remove('ckw-cird__hide-password');
    formField.passwordButton.classList.contains('ckw-cird__show_btn_transition') ?
        formField.passwordButton.classList.replace(
            'ckw-cird__show_btn_transition',
            'ckw-cird__hide_btn_transition'
        ) :
        formField.passwordButton.classList.add('ckw-cird__hide_btn_transition');
  }


  /**
   * Gère l'evenement de fermeture du formulaire de changement de mot de passe
   * @param {HTMLElement} formField
   */
  _closePwdForm(formField){

    /** Cache le formulaire et fait apparaître un message et le bouton initial */
    formField.sectionPwd.classList.add('ckw-cird__hide-password');
    formField.passwordButton.classList.replace(
        'ckw-cird__hide_btn_transition',
        'ckw-cird__show_btn_transition'
    );

    this._clearForm(formField);
  }


  /**
   * Vide le formulaire de changement de mot de passe et retire le(s) message(s) d'erreur
   * @param {HTMLElement} field
   */
  _clearForm(field){
    /** Retire le(s) message(s) d'erreur(s) */

    for(let item of field.sectionPwd.querySelectorAll('.ckw-cird__error')){
      item.textContent = '';
    }

    /** Vide les champs */

    for(let item of field.sectionPwd.querySelectorAll('.ckw-cird__input')){
      item.value = '';
    }
  }

  /**
   * Gère la fermeture et l'affichage du message de succès pour le formulaire de mot de passe
   * @param {HTMLElement} formField
   */
  _successPwdForm(formField, closePwdForm){
    closePwdForm(formField);
    formField.textAlert.classList.remove('ckw-cird__hide');
  }


  /**
   * Fonction qui gère l'upload de l'image
   */
  _sendingImage(){
    const fileInput = this._fields.file;
    const imgField = document.querySelector(`#${this.prefix}image`);
    const api = this._api;

    fileInput.addEventListener("change", async () => {
      // On cache l'image de profil actuelle
      this.showImageProfileLoading();

      // On récupère le fichier et on crée le formdata
      const file = fileInput.files[0];
      const formData = new FormData();

      let resizedImageBlob;

      try {
        // On resize l'image avec une taille max de 200px
        resizedImageBlob = await resizeAndCompressImage(file, 200);
      } catch (error) {
        // Si y'a une erreur pendant le traitement on l'affiche & on cache le loading
        this.hideImageProfileLoading();
        return showAlert(this._translator.translate('profile.errorDuringImageProcessing'));
      }

      // On récupère la taille de l'image
      const sizeInMB = resizedImageBlob.size / 1024 / 1024;

      // Si la taille max est dépassée on affiche uen erreur et on cache le loading
      if(sizeInMB > 20){
        this.hideImageProfileLoading();
        return showAlert(this._translator.translate('profile.imageTooLarge'));
      }

      // On ajoute les données au form data
      formData.append("files[0]", resizedImageBlob, "profil.jpg");
      formData.append("kwapApi", "1");

      // On envoi la  requête
      api
          .post("/ajax/ajouterPortrait", formData, {cookies: true})
          .then((resultRequest) => {

            // S'il y a une erreur on affiche une alert & on cache le loading
            if(resultRequest.status === 'error'){
              this.hideImageProfileLoading();
              return showAlert(this._translator.translate('profile.errorDuringImageUpload'));
            }

            // Pour éviter que l'image soit mis en cache par le navigateur, on mets un timestamp à la fin de l'url
            imgField.setAttribute("src", resultRequest.data + "&time=" + new Date().getTime());
          });
    });

    // On enlève le loader quand l'image à fini de chargée
    imgField.addEventListener("load", () => {
       this.hideImageProfileLoading();
    });
  }

  /**
   * Fonction qui gère le changement de mot de passe de l'utilisateur
   * @param form
   * @param fields
   * @param api
   * @param validator
   */
  _changePassword(form, fields, api, validator, successPwdForm) {
    let btnChangePassword = document.querySelector(
        `#${this.prefix}submit-password`
    );

    const formField = this._getFormField();
    const closePwdForm = () => this._closePwdForm(formField);


    on(btnChangePassword, "click", function () {
      const data = {
        old_password: fields.old_password.value,
        new_password: fields.new_password.value,
        confirm_password: fields.verify_password.value,
      };

      if (
          validator.validatePassword(fields.new_password) &&
          validator.validatePasswordConfirmation(
              fields.new_password,
              fields.verify_password
          ) &&
          validator.validateOtherFields(fields.old_password)
      ) {
        api
            .post("/api/kwap/updatePassword", data, { cookies: true })
            .then((apiResponse) => {
              if (apiResponse.status === "error") {
                form.showError("passwordWrong", [fields.old_password]);
                return false;
              }

              // Cache le formulaire, vide les champs, efface le(s) message(s) d'erreur(s) et fait apparaître un message et le bouton initial
              successPwdForm(formField, closePwdForm);

            });
      }
    });
  }


  /**
   * Gère l'affichage des tooltips et leur contenu
   * @param {HTMLElement} btn
   * @param {HTMLElement} text
   */
  _tooltipProvider(btn, text){

    const popperInstance = createPopper(btn, text, {
          placement: 'right',
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [7,8],
              },
            }
          ]
        }
    );

    const show = () => {
      // Rend le tooltip visible
      text.setAttribute('data-show', '')

      // On écoute l'évenement
      popperInstance.setOptions((options) => ({
        ...options,
        modifiers: [
          ...options.modifiers,
          {name: 'eventListeners', enabled: true},
        ]
      }))

      popperInstance.update();
    }

    const hide = () => {
      // Rend le tooltip invisible
      text.removeAttribute('data-show')

      // On écoute l'évenement
      popperInstance.setOptions((options) => ({
        ...options,
        modifiers: [
          ...options.modifiers,
          {name: 'eventListeners', enabled: false},
        ]
      }))
    }

    const showEvent = ['mouseenter', 'focus']
    const hideEvent = ['mouseleave', 'blur']

    showEvent.forEach(event => {
      btn.addEventListener(event, show)
    });

    hideEvent.forEach(event => {
      btn.addEventListener(event, hide)
    });

  }

  /**
   * Retourne true si le formulaire est correctement renseigné
   * @return {boolean}
   * @protected
   */
  _validateForm() {
    return (
        this._validator.validateOtherFields(this._fields.pseudo) &&
        this._validator.validateEmail(this._fields.email) &&
        (this._fields.professionnel.checked
            ? this._validator.validateOrganizationName(
                this._fields.organizationName
            ) &&
            this._validator.validateOrganizationType(
                this._fields.organizationType
            ) &&
            this._validator.validateWebsite(this._fields.website)
            : this._validator.validatePro(this._fields.professionnel)) &&
        (!this._fields.billing.checked
            ? this._validator.validateNumAddress(this._fields.numAddr) &&
            this._validator.validateNameAddress(this._fields.nameAddr) &&
            this._validator.validateCpAdress(this._fields.postal) &&
            this._validator.validateCity(this._fields.city) &&
            this._validator.validateCountry(this._fields.countryList) &&
            this._validator.validateNumAddress(this._fields.numAddrFac) &&
            this._validator.validateNameAddress(this._fields.nameAddrFac) &&
            this._validator.validateCpAdress(this._fields.facPostal) &&
            this._validator.validateCity(this._fields.facCity) &&
            this._validator.validateCountry(this._fields.countryListFac) : true)
    );
  }


  /**
   * Envoie le formulaire
   * @param {Object} data
   * @return {Promise<ApiResult>}
   * @protected
   */
  _send(data) {

    // Change la valeur en fonction de son état (Cocher => False, Décocher => True)
    if(this._fields.billing.checked){
      data.billing = false;
    } else {
      data.billing = true;
    }

    return this._api.post("/api/kwap/editProfil", data, {
      cookies: true,
      credentials: "include",
    });
  }

  /**
   * Permet d'afficher le loading de l'image de profil
   */
  showImageProfileLoading(){
    document.querySelector('#ckw-cird__profile-management__image').style.display = "none";
    document.querySelector('.ckw-cird__profile-management__image-loading').style.display = "flex";
  }

  /**
   * Permet de cacher le loading de l'image de profil
   */
  hideImageProfileLoading(){
    document.querySelector('#ckw-cird__profile-management__image').style.display = "block";
    document.querySelector('.ckw-cird__profile-management__image-loading').style.display = "none";
  }
}
