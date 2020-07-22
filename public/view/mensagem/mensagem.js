var writing = !1, usuario = {};

/**
 * Function to update the chat conversation
 * @private
 */
function _updatedChat() {
    if (navigator.onLine) {
        if (typeof (EventSource) !== "undefined" && HOME !== "" && HOME === SERVER) {
            let u = new EventSource(SERVER + "get/event/chatUpdate/" + usuario.id + "/maestruToken/" + USER.token, {withCredentials: true});
            u.onmessage = function (event) {
                if (typeof event.data === "string" && event.data !== "" && isJson(event.data)) {
                    receiveMessage(JSON.parse(event.data));
                }
            };
        } else {
            setInterval(function () {
                AJAX.getUrl(SERVER + "get/event/chatUpdate/" + usuario.id).then(u => {
                    if (u.data !== "" && typeof u.data === "string" && isJson(u.data)) {
                        receiveMessage(JSON.parse(u.data));
                    }
                });
            }, 500);
        }
    }
}

function receiveMessage(mensagens) {
    if(typeof mensagens === "object" && mensagens !== null && mensagens.constructor === Array && !isEmpty(mensagens)) {
        console.log(mensagens);
        for(let message of mensagens) {
            if ($.trim(message.mensagem).length) {
                if (message.mensagem === "~^") {
                    showWriting();
                } else {
                    clearTimeout(writing);
                    showLastOnline();
                    $('<li class="replies"><p>' + message.mensagem + '<small>' + moment(message.data).format("HH:mm") + '</small></p></li>').appendTo($('.messages ul'));
                }
            }
        }
        $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
    }
}

function showWriting() {
    $("#perfil-status").html("digitando...");
    clearTimeout(writing);
    writing = setTimeout(function () {
        showLastOnline();
    }, 1500);
}

function sendMessage(mensagem) {
    if ($.trim(mensagem).length) {
        AJAX.post("chatSendMessage", {usuario: usuario.id, mensagem: mensagem});

        $('<li class="sent"><p>' + mensagem + '<small>' + moment().format("HH:mm") + '</small></p></li>').appendTo($('.messages ul'));
        $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
        $("#message-text").val('');
    }
}

async function showAllMessages() {
    if(isNumberPositive(usuario.mensagens.mensagem)) {
        let mensagens = await read.exeRead("messages", usuario.mensagens.mensagem);
        if (typeof mensagens.messages === "object" && mensagens.messages !== null && mensagens.messages.constructor === Array) {
            let html = "";
            for (let message of mensagens.messages) {
                if ($.trim(message.mensagem).length && message.mensagem !== "~^")
                    html += '<li class="' + (message.usuario == USER.id ? "replies" : "sent") + '"><p>' + message.mensagem + '<small>' + moment(message.data).format("HH:mm") + '</small></p></li>';
            }
            $(".messages > ul").html(html);
            $(".messages")[0].scrollTop = $(".messages")[0].scrollHeight;
        }
    } else {
        $(".messages > ul").html("");
    }
}

async function readUser() {
    usuario = await read.exeRead("usuarios", history.state.param.url[0]);
    usuario.imagem = (!isEmpty(usuario.imagem) ? (usuario.imagem.constructor === Array && typeof usuario.imagem[0] !== "undefined" ? usuario.imagem[0].url : usuario.imagem) : HOME + "assetsPublic/img/img.png");
}

function updateDomInfo() {
    $("#mensagemHeader").htmlTemplate("mensagemHeader", usuario);
    showLastOnline();

    /**
     * Check blocked status
     */
    if (usuario.mensagens.bloqueado)
        $("#bloquear > li").html("desbloquear");

    /**
     * Check silence status
     */
    if (usuario.mensagens.silenciado)
        $("#silenciar > li").html("não silenciar");
}

function showLastOnline() {
    $("#perfil-status").html((usuario.mensagens.bloqueado ? "<i class='material-icons blocked'>block</i>" : "") + (usuario.mensagens.silenciado ? "<i class='material-icons'>volume_off</i>" : "") + (!isEmpty(usuario.mensagens.ultima_vez_online) ? moment(usuario.mensagens.ultima_vez_online) : moment()).calendar());
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

(async () => {
    /**
     * Retrieve user info
     * show user on DOM
     */
    await readUser();

    /**
     * Retrieve messages chat data
     */
    let messageUser = await read.exeRead("messages_user", {"usuario": usuario.id});
    usuario.mensagens = (messageUser.constructor === Array ? messageUser[0] : messageUser);
    usuario.mensagens.status = (usuario.mensagens.bloqueado ? "<i class='material-icons blocked'>block</i>" : "") + (usuario.mensagens.silenciado ? "<i class='material-icons'>volume_off</i>" : "") + (!isEmpty(usuario.mensagens.ultima_vez_online) ? moment(usuario.mensagens.ultima_vez_online) : moment()).calendar();
    updateDomInfo();

    /**
     * Read and show messages on DOM
     */
    await showAllMessages();

    /**
     * Input text click
     */
    $("#message-text").off("keyup").on("keyup", function () {
        if (event.keyCode === 13)
            sendMessage($(this).val());
        else
            AJAX.get("chatIsWriting/" + usuario.id);
    });

    /**
     * Buttons click
     */
    $('.submit').click(function () {
        sendMessage($("#message-text").val());
    });

    $(".social-media").off("click").on("click", function () {
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
    });

    $("#silenciar").off("click").on("click", function () {
        $("#silenciar > li").html(usuario.mensagens.silenciado ? "silenciar" : "não silenciar");
        usuario.mensagens.silenciado = usuario.mensagens.silenciado == 1 ? 0 : 1;
        showLastOnline();
        $("#menu-chat").removeClass("active");
        $("body").off("mouseup");
        AJAX.post("chatSilenciar", {user: usuario.id, silenciado: usuario.mensagens.silenciado});
    });

    $("#bloquear").off("click").on("click", function () {
        $("#bloquear > li").html((usuario.mensagens.bloqueado ? "" : "des") + "bloquear");
        usuario.mensagens.bloqueado = usuario.mensagens.bloqueado == 1 ? 0 : 1;
        showLastOnline();
        $("#menu-chat").removeClass("active");
        $("body").off("mouseup");
        AJAX.post("chatBloquear", {user: usuario.id, bloqueado: usuario.mensagens.bloqueado});
    });

    /**
     * Send Anexo
     */
    let templates = await getTemplates();
    $("#anexo").off("change").on("change", async function (e) {
        if (typeof e.target.files[0] !== "undefined") {
            let upload = await AJAX.uploadFile(e.target.files);

            /**
             * Send message anexo
             */
            for (let file of upload)
                sendMessage(Mustache.render(templates.anexoCard, file));
        }
    });

    /**
     * Função de click nos cards
     */
    $("#app").off("click", ".modal-open").on("click", ".modal-open", function () {
        _openPreviewFile($(this).data("url"), $(this).data("nome"), $(this).data("name"), $(this).data("type"), $(this).data("filetype"), $(this).find(".preview").html());
    });

    _resizeControl();
    _updatedChat();
})();