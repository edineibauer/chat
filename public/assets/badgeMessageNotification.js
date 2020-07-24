/**
 * Verifica se tem notificações pendentes
 * @returns {Promise<void>}
 */
if(typeof messageBadgeNote === "undefined") {
    var messageBadgeNote = null;

    function _messageBadgeShow(badge) {
        let $navbar = $("#core-header-nav-bottom").find("a[href='mensagens']");
        $navbar.find(".badge-notification").remove();

        /**
         * Adiciona badge notification apenas no navbar mobile e se tiver a aba de notificações
         */
        if (badge !== "0")
            $navbar.append("<span class='badge-notification'>" + badge + "</span>");
    }

    async function messageBadgeNotification() {
        if (!messageBadgeNote) {
            if ($("#core-header-nav-bottom").find("a[href='mensagens']").length && USER.setor !== 0) {
                if (typeof (EventSource) !== "undefined" && HOME !== "" && HOME === SERVER) {
                    if (messageBadgeNote)
                        messageBadgeNote.close();

                    messageBadgeNote = new EventSource(SERVER + "get/event/sse/chatBadgeNotification/maestruToken/" + USER.token, {withCredentials: true});

                    messageBadgeNote.onmessage = function (event) {
                        _messageBadgeShow(event.data);
                    };
                } else {
                    if (messageBadgeNote)
                        clearInterval(messageBadgeNote);

                    messageBadgeNote = setInterval(async function () {
                        _messageBadgeShow(await AJAX.get("event/chatBadgeNotification"));
                    }, 2000);
                }
            }
        }
    }

    $(function () {
        messageBadgeNotification();
    });
}