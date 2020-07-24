async function readPeopleMessages() {
    let messages = await AJAX.get("event/chatAllmessagesUser");

    if (!isEmpty(messages)) {
        for(let message of messages)
            message.ultima_vez_online = (!isEmpty(message.ultima_vez_online) ? moment((isNumberPositive(message.ultima_vez_online) ? parseInt(message.ultima_vez_online + "000") : message.ultima_vez_online)).calendar() : "nunca online");

        $("#list-message").htmlTemplate("cardMessages", messages);
    } else {
        $("#list-message").htmlTemplate("notificacoesEmpty", {mensagem: "Nenhuma mensagem no momento"});
    }
}

$(function () {
    (async () => {
        await readPeopleMessages();
    })();
});