var chatWriting = !1, chatIsWriting, usuarioChat = {}, updateChatInterval;

function destruct() {
    if(typeof updateChatInterval !== "undefined") {
        if (typeof (EventSource) !== "undefined" && HOME !== "" && HOME === SERVER)
            updateChatInterval.close();
        else
            clearInterval(updateChatInterval);
    }
}

/**
 * Function to update the chat conversation
 * @private
 */
function _updatedChat() {
    if (navigator.onLine) {
        if (typeof (EventSource) !== "undefined" && HOME !== "" && HOME === SERVER) {
            if(typeof updateChatInterval !== "undefined")
                updateChatInterval.close();

            updateChatInterval = new EventSource(SERVER + "get/event/sse/chatUpdate/" + usuarioChat.id + "/maestruToken/" + USER.token, {withCredentials: true});
            updateChatInterval.onmessage = function (event) {
                if (typeof event.data === "string" && event.data !== "" && isJson(event.data)) {
                    receiveMessage(JSON.parse(event.data));
                }
            };
        } else {
            if(typeof updateChatInterval !== "undefined")
                clearInterval(updateChatInterval);

            updateChatInterval = setInterval(function () {
                AJAX.getUrl(SERVER + "get/event/chatUpdate/" + usuarioChat.id).then(u => {
                    if (typeof u.data === "object") {
                        receiveMessage(u.data);
                    }
                });
            }, 500);
        }
    }
}

function receiveMessage(mensagens) {
    if (typeof mensagens === "object" && mensagens !== null && mensagens.constructor === Array && !isEmpty(mensagens)) {
        for (let message of mensagens) {
            if ($.trim(message.mensagem).length) {
                if (message.mensagem === "~^") {
                    showWriting();
                } else {
                    clearTimeout(chatWriting);
                    showLastOnline();
                    $('<li class="sent"><p>' + message.mensagem + '<small>' + moment(message.data).format("HH:mm") + '</small></p></li>').appendTo($('.messages ul'));
                }
            }
        }
        $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
    }
}

function showWriting() {
    $("#perfil-status").html("digitando...");
    clearTimeout(chatWriting);
    chatWriting = setTimeout(function () {
        showLastOnline();
    }, 1500);
}

function sendMessage(mensagem) {
    if (!usuarioChat.mensagens.bloqueado) {
        if ($.trim(mensagem).length) {
            AJAX.post("chatSendMessage", {usuario: usuarioChat.id, mensagem: mensagem});

            $('<li class="replies"><p>' + mensagem + '<small>' + moment().format("HH:mm") + '</small></p></li>').appendTo($('.messages ul'));
            $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
            $("#message-text").val('');
        }
    } else {
        toast("Usuário bloqueado", 1500, "toast-error");
    }
}

async function showMessages(messages) {
    if(!isEmpty(messages)) {
        let htmlMessage = "";
        for (let message of messages) {
            if ($.trim(message.mensagem).length && message.mensagem !== "~^")
                htmlMessage += '<li class="' + (message.usuario == USER.id ? "replies" : "sent") + '"><p>' + message.mensagem + '<small>' + moment(message.data).format("HH:mm") + '</small></p></li>';
        }
        $(".messages > ul").append(htmlMessage);
        $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
    }
}

async function showAllMessages() {
    if (isNumberPositive(usuarioChat.mensagens.mensagem)) {
        let mensagens = await db.exeRead("messages", usuarioChat.mensagens.mensagem);
        if(!isEmpty(mensagens)) {
            mensagens = mensagens[0];
            if (typeof mensagens.messages === "object" && mensagens.messages !== null && mensagens.messages.constructor === Array)
                showMessages(mensagens.messages);
        }
    }

    /**
     * Search on files pending
     */
    showMessages(await AJAX.get("event/chatPending/" + usuarioChat.id));
}

async function readUser() {
    usuarioChat = await db.exeRead("usuarios", URL[0]);

    if(!isEmpty(usuarioChat)) {
        usuarioChat = usuarioChat[0];

        console.log(usuarioChat);

        /**
         * This user chat is a profissional too
         */
        if(!isEmpty(usuarioChat.relationData.clientes.perfil_profissional)) {
            usuarioChat.nome = usuarioChat.relationData.clientes.perfil_profissional[0].nome;
            usuarioChat.imagem = usuarioChat.relationData.clientes.perfil_profissional[0].imagem_de_perfil[0].urls.thumb;
        } else {
            /**
             * Just cliente, check if have social image or so perfil image
             */
            usuarioChat.imagem = (!isEmpty(usuarioChat.relationData.clientes.imagem_url) ? usuarioChat.relationData.clientes.imagem_url : (!isEmpty(usuarioChat.imagem) ? usuarioChat.imagem[0].urls.thumb : HOME + "assetsPublic/img/img.png"));
        }

        /**
         * Retrieve messages chat data
         */
        let messageUser = await db.exeRead("messages_user", {"usuario": usuarioChat.id});
        if (!isEmpty(messageUser) && isNumberPositive(messageUser[0]['mensagem']))
            usuarioChat.mensagens = messageUser[0];

        if (typeof usuarioChat.mensagens === "undefined") {
            usuarioChat.mensagens = {
                aceito: 0,
                bloqueado: 0,
                silenciado: 0,
                mensagem: null,
                status: "não respondeu",
                ultima_vez_online: "",
                usuario: usuarioChat.id
            };
        }

        usuarioChat.mensagens.ultima_vez_online = await AJAX.get("event/chatOnline/" + usuarioChat.id);
        usuarioChat.mensagens.ultima_vez_online = (!isEmpty(usuarioChat.mensagens.ultima_vez_online) ? moment(usuarioChat.mensagens.ultima_vez_online).calendar() : "não respondeu");
        usuarioChat.mensagens.status = (usuarioChat.mensagens.bloqueado ? "<i class='material-icons blocked'>block</i>" : "") + (usuarioChat.mensagens.silenciado ? "<i class='material-icons'>volume_off</i>" : "") + usuarioChat.mensagens.ultima_vez_online;
        updateDomInfo();
    }
}

function updateDomInfo() {
    $("#mensagemHeader").htmlTemplate("mensagemHeader", usuarioChat);
    showLastOnline();

    /**
     * Check blocked status
     */
    if (usuarioChat.mensagens.bloqueado)
        $("#bloquear > li").html("desbloquear");

    /**
     * Check silence status
     */
    if (usuarioChat.mensagens.silenciado)
        $("#silenciar > li").html("não silenciar");
}

function showLastOnline() {
    $("#perfil-status").html((usuarioChat.mensagens.bloqueado ? "<i class='material-icons blocked'>block</i>" : "") + (usuarioChat.mensagens.silenciado ? "<i class='material-icons'>volume_off</i>" : "") + usuarioChat.mensagens.ultima_vez_online);
}

function closeModal() {
    $("#app").off("mouseup");
    $("#modalPreviewFile, #core-overlay").removeClass("active");
    $("#modalContent").html("");
}

function getContent(url, nome, type, fileType) {
    let $content = "";
    if (type === 1) {
        //imagem
        $content = "<img src='" + url + "' class='col' title='" + nome + "' alt='imagem para " + nome + "' />";
    } else if (type === 2) {
        //video
        $content = "<video height='700' controls><source src='" + url + "' type='" + fileType + "'></video>";
    } else if (type === 3) {
        //document
        $content = $("<iframe/>").attr("src", "https://docs.google.com/gview?embedded=true&url=" + url).attr("frameborder", "0").css({
            width: "100%",
            height: "99%",
            "min-height": (window.innerHeight - 200) + "px"
        });
    } else if (type === 4) {
        //audio
        $content = "<audio controls><source src='" + url + "' type='" + fileType + "'></audio>";
    }
    return $content;
}

function _resizeControl() {
    $("#modalPreviewFile").css("margin-left", ((window.innerWidth - $("#modalPreviewFile").width()) / 2) + "px");
    window.addEventListener("resize", function () {
        $("#modalPreviewFile").css("margin-left", ((window.innerWidth - $("#modalPreviewFile").width()) / 2) + "px");
    });
}

function _openPreviewFile(url, nome, name, type, fileType, preview) {
    /**
     * Overlay
     */
    $("#core-overlay").css("background-color", "rgba(0,0,0,.8)");
    $("#core-overlay, #modalPreviewFile").addClass("active");

    /**
     * Modal Content
     */
    $("#modalTitle").html((!/^image\//.test(fileType) ? preview : "") + nome);
    $("#modalContent").html(getContent(url, nome, type, fileType));
    $(".downloadModal").attr("href", url);
    if (type === 2)
        $("#modalContent video")[0].play();
    else if (type === 4)
        $("#modalContent audio")[0].play();

    /**
     * Close modal
     */
    $("#app").off("mouseup").on("mouseup", function (e) {
        if ($(".closeModal").is(e.target) || $(".closeModal > i").is(e.target) || $(".closeModal > #modalTitle").is(e.target) || $(".previewFileCard").is(e.target))
            closeModal();
    });
}

$(function () {
    (async () => {
        $(".messages > ul").html("");

        /**
         * Retrieve user info
         * show user on DOM
         */
        await readUser();
        let templates = await getTemplates();

        /**
         * Read and show messages on DOM
         */
        await showAllMessages();

        $("#app").off("click", ".submit").on("click", ".submit", function () {
            sendMessage($("#message-text").val());

        }).off("keyup", "#message-text").on("keyup", "#message-text", function () {
            if (event.keyCode === 13) {
                sendMessage($(this).val());
            }else {
                clearTimeout(chatIsWriting);
                chatIsWriting = setTimeout(function () {
                    AJAX.get("chatIsWriting/" + usuarioChat.id);
                }, 400);
            }

        }).off("click", ".social-media").on("click", ".social-media", function () {
            let $menu = $("#menu-chat");
            if (!$menu.hasClass("active")) {
                $menu.addClass("active");
                $("body").off("mouseup").on("mouseup", function (e) {
                    if (!$menu.is(e.target) && $menu.has(e.target).length === 0) {
                        setTimeout(function () {
                            $menu.removeClass("active");
                            $("body").off("mouseup");
                        }, 50);
                    }
                })
            }

        }).off("click", "#silenciar").on("click", "#silenciar", function () {
            $("#silenciar > li").html(usuarioChat.mensagens.silenciado ? "silenciar" : "não silenciar");
            usuarioChat.mensagens.silenciado = usuarioChat.mensagens.silenciado == 1 ? 0 : 1;
            showLastOnline();
            $("#menu-chat").removeClass("active");
            $("body").off("mouseup");
            db.exeCreate("messages_user", {id: usuarioChat.mensagens.id, silenciado: usuarioChat.mensagens.silenciado});

        }).off("click", "#bloquear").on("click", "#bloquear", function () {
            $("#bloquear > li").html((usuarioChat.mensagens.bloqueado ? "" : "des") + "bloquear");
            usuarioChat.mensagens.bloqueado = usuarioChat.mensagens.bloqueado == 1 ? 0 : 1;
            showLastOnline();
            $("#menu-chat").removeClass("active");
            $("body").off("mouseup");
            db.exeCreate("messages_user", {id: usuarioChat.mensagens.id, bloqueado: usuarioChat.mensagens.bloqueado});

        }).off("click", ".modal-open").on("click", ".modal-open", function () {
            _openPreviewFile($(this).data("url"), $(this).data("nome"), $(this).data("name"), $(this).data("type"), $(this).data("filetype"), $(this).find(".preview").html());

        }).off("change", "#anexo").on("change", "#anexo", async function (e) {

            /**
             * Send Anexo
             */
            if (!usuarioChat.mensagens.bloqueado) {
                if (typeof e.target.files[0] !== "undefined") {
                    let upload = await AJAX.uploadFile(e.target.files);

                    /**
                     * Send message anexo
                     */
                    for (let file of upload)
                        sendMessage(Mustache.render(templates.anexoCard, file));
                }
            } else {
                toast("Usuário bloqueado", 1500, "toast-error");
            }
        });

        _resizeControl();
        _updatedChat();
    })();
});