/**
 * Map les codes d'erreurs serveur vers les clés de traductions côté client
 */
const errorMap = {
    TOS_NOT_VALIDATED: 'cguMissing',
    EMAIL_ALREADY_USED: 'accountAlreadyExist',
    INVALID_PASSWORD: 'passwordMissing',
    PASSWORD_RESET_NOT_ENABLED: 'passwordResetNotEnabled'
};

/**
 * Formatte/traduit une erreur ou code d'erreur
 */
export class ErrorFormatter {

    /**
     * @param {Translator} translator
     */
    constructor(translator) {
        this._translator = translator;
    }

    /**
     * Retourne le message correspondant à une traduction / un code d'erreur
     * @param {string|string[]} error
     * @return {string}
     */
    getMessage(error) {

        if (Array.isArray(error) || /^[A-Z]+(_[A-Z]+)+$/.test(error)) {
            if (error[0] && error[0][0] === '{') {
                const parsedError = JSON.parse(error[0]);

                if (parsedError.errorCode) {
                    error = parsedError.errorCode;
                // Si on a un message d'erreur on le retourne directement.
                } else if (parsedError.message) {
                    return parsedError.message;
                }
            }

            if (typeof error === 'string' && errorMap.hasOwnProperty(error)) {
                return this._translator.translate(errorMap[error]);
            }

            if (Array.isArray(error)) {
                error = error.join(': ');
            }

            return `${this._translator.translate('unknownError')}: ${error}`;
        }

        return this._translator.translate(error);
    }
}
