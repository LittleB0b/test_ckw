
/**
 * Permet de gérer le l'import, la suppression du Recaptcha
 */
export class RecaptchaService {

  constructor(cird) {
    this._cird = cird;
    this._scriptElement = null;
    this._recaptchaBadgeElement = null;
  }

  /**
   * Permet de récupérer le script recaptcha principal
   * @returns {HTMLScriptElement|null}
   */
  get scriptElement() {
    if (!this._scriptElement) {
      this._scriptElement = document.querySelector('[data-tag="ckw-cird__recaptcha"]');
    }

    return this._scriptElement;
  }

  /**
   * Permet de récupérer le badge du Recaptcha
   * @returns {HTMLElement|null}
   */
  get recaptchaBadgeElement() {
    if (!this._recaptchaBadgeElement) {
      this._recaptchaBadgeElement = document.querySelector('.grecaptcha-badge');
    }

    return this._recaptchaBadgeElement;
  }

  /**
   * Ajoute dans le DOM le script qui doit charger le recaptcha
   * @return {void}
   */
  loadRecaptchaScript() {
    // Si on passe sur l'interface d'inscription cette méthode est executée, 
    // pareil pour l'interface de connexion, du coup pour éviter d'avoir plusieurs fois 
    // le script on vérifie si il est déjà présent
    if (!this._isRecaptchaScriptInDOM() && this.canLoadRecaptcha()) {
      this._scriptElement = document.createElement('script');
      this._scriptElement.dataset.tag = 'ckw-cird__recaptcha';
      this._scriptElement.src = `https://www.google.com/recaptcha/api.js?render=${ENV_FILE.RECAPTCHA_V3_PUBLIC_KEY}`;
      // On attend que le script Recaptcha soit chargé
      this._scriptElement.addEventListener('load', () => {
        if (this._cird._standalone) {
          // On doit attendre que le recaptcha soit chargé la méthode "setZIndex" ne va pas fonctionner
          grecaptcha.ready(() => {
            const { zIndex } = getComputedStyle(this._cird._popin._container);
            // On met le zIndex à 10001 car il est à 10000 sur la popin du mode standalone des applis
            // Sinon le Recaptcha passe en dessous de la popin
            const newZIndex = zIndex === 'auto' ? 10001 : +zIndex + 100;
            this.setZIndex(newZIndex);
          });
        }
      });

      document.body.appendChild(this._scriptElement);
    }
  }

  /**
   * Retire entièrement un recaptcha
   * @returns {void}
   */
  removeRecaptcha() {
    this._removeRecaptchaScript();
    this._removeRecaptchaFromDOM();
  }

  /**
   * Permet de modifier le z-index du badge du Recaptcha
   * @param {number} zIndex Le nouveau z-index du badge Recaptcha 
   */
  setZIndex(zIndex) {
    if (this.recaptchaBadgeElement) {
      this.recaptchaBadgeElement.style.zIndex = zIndex;
    }
  }

  /**
   * Retourne "true" si il y a l'url "https://www.google.com/recaptcha/*" 
   * dans les allowNavigation de la config des applis ou si on n'est pas dans une appli
   * @returns {boolean}
   */
  canLoadRecaptcha() {
    if (this._cird.isInAppMode() && 'kwap' in window) {
      /** @type {string[]|undefined} */
      const allowNavigation = window.kwap?.config.get('allowNavigation');
      return allowNavigation && allowNavigation.includes('https://www.google.com/recaptcha/*');
    }

    // ====================== TEMPORAIRE ======================
    // Le temps que les urls de prod et preprod du board ffr ne sont pas dans la liste des urls autorisés
    // On n'affiche pas le Recaptcha
    if (['board_ffrandonnee', 'com.cirkwi.marando'].includes(this._cird.getAppId())) {
      return false;
    }
    
    return true;
  }

  /**
   * Vérifie si le script ReCaptcha est déjà dans le DOM
   * @returns {boolean}
   * @private
   */
  _isRecaptchaScriptInDOM() {
    // Converti un HTMLScriptElement ou null en booléen
    return !!this.scriptElement;
  }

  /**
   * Retire le script ReCaptcha du DOM
   * @returns {void}
   * @private
   */
  _removeRecaptchaScript() {
    if (this.scriptElement) {
      this.scriptElement.remove();
      this._scriptElement = null;
    }

    // Le script reCaptcha charge aussi un autre script
    const gstaticScript = document.querySelector('script[src*="www.gstatic.com/recaptcha/releases/"]');

    if (gstaticScript) {
      gstaticScript.remove();
    }

    if (window.grecaptcha) {
      delete window.grecaptcha;
    }

    if (window.___grecaptcha_cfg) {
      delete window.___grecaptcha_cfg;
    }
  }

  /**
   * Retire les balises dans le dom qui représentent le ReCaptcha
   * @returns {void}
   * @private
   */
  _removeRecaptchaFromDOM() {
    if (this.recaptchaBadgeElement) {
      // On retire le parent car le script de ReCaptcha rajoute une DIV inutile
      this.recaptchaBadgeElement.parentElement.remove();
      this._recaptchaBadgeElement = null;
    }
  }

}
