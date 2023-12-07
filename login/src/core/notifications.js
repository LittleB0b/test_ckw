import {htmlToDom} from './utils';
import "./notifications.scss";

export class Notification {

    /**
     * @param {string} message
     */
    constructor(message) {
        this._message = message;
    }

    _createElement() {
        const html =
`<div class="cird_notification">
    <p class="cird_notification__text">${this._message}</p>
    <button class="cird_notification__close-button">X</button>
</div>`;

        return htmlToDom(html).children[0];
    }

    /**
     * @return {HTMLDivElement}
     */
    getElement() {
        if (this._element == null) {
            this._element = this._createElement();

            this._element.querySelector('.cird_notification__close-button').addEventListener('click', () => {
                this.remove();
            });
        }

        return this._element;
    }

    remove() {
        if (this._element) {
            this._element.remove();
        }
    }
}

export class NotificationManager {

    /**
     * @param {Translator} translator
     * @param {Element} container
     */
    constructor(translator, container) {
        this._translator = translator;
        this._container = container;
    }

    /**
     * @param {ParentNode} container
     */
    _removeCurrentNotification(container) {
        const notificationEl = container.querySelector('.cird_notification');

        if (notificationEl) {
            notificationEl.remove();
        }
    }

    /**
     *
     * @param {Notification} notification
     * @param {Node} elementBefore
     * @private
     */
    _insertNotificationBefore(notification, elementBefore) {
        const container = elementBefore.parentNode;

        this._removeCurrentNotification(container);
        container.insertBefore(notification.getElement(), elementBefore);
    }

    /**
     *
     * @param {string} message
     */
    notify(message) {
        const notification = new Notification(this._translator.translate(message));
        const title = document.querySelector('.ckw-cird__title') || this._container;

        this._insertNotificationBefore(notification, title);
    }
}
