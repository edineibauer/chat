async function readPeopleMessages() {
    let messages = await read.exeRead("messages_user");
    let pending = await AJAX.get("event/chatAllPending");
    let isEmptyMessages = isEmpty(messages);

    if (!isEmptyMessages) {
        for(let message of messages) {
            message.ultima_vez_online = await AJAX.get("event/chatOnline/" + message.usuario);
            message.ultima_vez_online = (!isEmpty(message.ultima_vez_online) ? moment(message.ultima_vez_online).calendar() : "nunca online");
            if(typeof pending[message.usuario] === "object") {
                message.pendente = pending[message.usuario].pendente;
                message.isPendente = !0;
                message.usuario = pending[message.usuario].usuario;

                delete pending[message.usuario.id];
            } else {
                message.pendente = 0;
                message.isPendente = !1;
                message.usuario = await read.exeRead("usuarios", message.usuario);
                message.usuario.imagem = (!isEmpty(message.usuario.imagem) ? (message.usuario.imagem.constructor === Array && typeof message.usuario.imagem[0] !== "undefined" ? message.usuario.imagem[0].url : message.usuario.imagem ) : HOME + "assetsPublic/img/img.png");
            }
        }
        $("#list-message").htmlTemplate("cardMessages", messages);
    }

    if(!isEmpty(pending))
        setPendingMessages(pending, isEmptyMessages);
    else if(isEmptyMessages)
        $("#list-message").htmlTemplate("notificacoesEmpty", {mensagem: "Nenhuma mensagem no momento"});
}

async function setPendingMessages(messages, isEmptyMessages) {
    if (!isEmpty(messages)) {
        let templates = await getTemplates();

        if(isEmptyMessages)
            $("#list-message").html("");

        for(let userId in messages) {
            messages[userId].ultima_vez_online = moment(parseInt(messages[userId].ultima_vez_online + "000")).calendar();
            $("#list-message").append(Mustache.render(templates.cardMessages, messages[userId]));
        }

    } else if(!$("#list-message").find(".mensagens-card").length) {
        $("#list-message").htmlTemplate("notificacoesEmpty", {mensagem: "Nenhuma mensagem no momento"});
    }
}

$(function () {
    (async () => {
        await readPeopleMessages();
    })();
});