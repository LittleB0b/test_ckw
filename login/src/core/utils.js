
/**
 * Ajoute un listener à une cible
 * @param {EventTarget|NodeListOf<EventTarget>} target
 * @param {string} type
 * @param {EventListener} listener
 */
export function on(target, type, listener) {
     if (target instanceof NodeList) {
         target.forEach(t => t.addEventListener(type, listener));
     }
     else if (target) {
         target.addEventListener(type, listener);
     }
}

/**
 * Ajoute un listener à un cible et le supprime après le premier appel
 * @param {EventTarget} target
 * @param {string} type
 * @param {EventListener} listener
 */
export function once(target, type, listener) {

    const wrapper = event => {
        listener(event);
        off(target, type, wrapper);
    };

    on(target, type, wrapper);
}

/**
 * Supprime un listener d'une cible
 * @param {EventTarget} target
 * @param {string} type
 * @param {EventListener} listener
 */
export function off(target, type, listener) {
    target.removeEventListener(type, listener);
}

/**
 * Exécute un callback de manière asynchrone
 * @param {Function} callback
 */
export function defer(callback) {
    setTimeout(callback, 0);
}

/**
 * Transforme du HTML en éléments DOM
 * @param {string} html
 * @return {HTMLElement}
 */
export function htmlToDom(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    return doc.body;
}

/**
 * Permet de redimmensionner et de compresser une image
 * @param file
 * @param maxWidthHeight
 * @param quality
 * @returns {Promise<unknown>}
 */
export function resizeAndCompressImage(file, maxWidthHeight, quality = 1) {
    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = function (event) {

            const img = new Image();

            img.onload = function () {
                const canvas = document.createElement('canvas');
                const scale = Math.max(maxWidthHeight / img.width, maxWidthHeight / img.height);

                // mise à l'échelle de l'image
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                // On redésinne l'image redimensionnée
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // On transforme l'image en jpg
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = event.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Permet d'afficher une alert
 * @param message
 */
export function showAlert(message){
    if(window.kwap){
        window.kwap.notificationService.alert(message);
    }
    else{
        window.alert(message);
    }
}
