<?php

/**
 * Search for pending messages to recovery
 */
$data['data'] = [];
$messages = [];

/**
 * Usuários com o qual já troquei mensagens
 */
if (!empty($_SESSION['userlogin']) && !empty($_SESSION['userlogin']['token'])) {
    $read = new \Conn\Read();
    $up = new \Conn\Update();
    $read->exeRead("messages_user");
    if ($read->getResult()) {
        foreach ($read->getResult() as $item) {
            $usuario = $item['usuario'];
            $read->exeRead("usuarios", "WHERE id = :id", "id={$usuario}");
            if ($read->getResult()) {
                $messages[$usuario] = ["usuario" => $read->getResult()[0], "bloqueado" => 0, "pendente" => 0, "silenciado" => 0, "home" => HOME];
                $messages[$usuario]['usuario']['imagem'] = (!empty($messages[$usuario]['usuario']['imagem']) ? json_decode($messages[$usuario]['usuario']['imagem'], !0)[0]['url'] : HOME . "assetsPublic/img/img.png");
                $messages[$usuario]['ultima_vez_online'] = $item['ultima_vez_online'];

                /**
                 * Atualiza minha ultima vez online para este usuário
                 */
                $up->exeUpdate("messages_user", ["ultima_vez_online" => date("Y-m-d H:i:s")], "WHERE ownerpub = {$usuario} && usuario = {$_SESSION['userlogin']['id']} && bloqueado = 0");

                $read->exeRead("messages", "WHERE id = :id", "id={$item['mensagem']}");
                if ($read->getResult()) {
                    $mensagem = json_decode($read->getResult()[0]["messages"], !0);
                    $mensagem = $mensagem[count($mensagem) -1];
                    $messages[$usuario]['lastMessage'] = ($mensagem['usuario'] === $_SESSION['userlogin']['id'] ? "<span style='color: #999'>eu: </span>" : "") . $mensagem['mensagem'];
                }
            }
        }
    }

    /**
     * Usuários que me mandaram mensagem e ainda não visualizei
     */
    if (file_exists(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending")) {
        foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending") as $item) {
            if (empty($messages[$item])) {

                /**
                 * Busca usuário
                 */
                $read->exeRead("usuarios", "WHERE id = :id", "id={$item}");
                if ($read->getResult()) {
                    $messages[$item] = ["usuario" => $read->getResult()[0], "bloqueado" => 0, "pendente" => 0, "silenciado" => 0, "home" => HOME];
                    $messages[$item]['usuario']['imagem'] = (!empty($messages[$item]['usuario']['imagem']) ? json_decode($messages[$item]['usuario']['imagem'], !0)[0]['url'] : HOME . "assetsPublic/img/img.png");

                    /**
                     * Busca mensagens pendentes
                     */
                    foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$item}") as $message) {
                        $mensagem = json_decode(file_get_contents(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$item}/{$message}"), !0);
                        $messages[$item]['lastMessage'] = $mensagem['mensagem'];
                        $messages[$item]['ultima_vez_online'] = $mensagem['data'];
                        $messages[$item]['pendente']++;
                    }
                }

            } else if(file_exists(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$item}")) {

                /**
                 * Seta mensagens pendentes para este usuário
                 */
                $mensagens = \Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$item}");
                $messages[$item]['pendente'] = count($mensagens);

                $mensagemLast = json_decode(file_get_contents(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$item}/" . $mensagens[count($mensagens) -1]), !0);
                $messages[$item]['lastMessage'] = ($mensagemLast['usuario'] === $_SESSION['userlogin']['id'] ? "<span style='color: #999'>eu: </span>" : "") . $mensagemLast['mensagem'];
            }
        }
    }

    /**
     * Usuário para o qual enviei mensagem e ainda não visualizaram
     */
    foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat") as $user) {
        if ($user !== $_SESSION['userlogin']['id']) {
            if (file_exists(PATH_HOME . "_cdn/chat/{$user}/pending/{$_SESSION['userlogin']['id']}")) {
                $read->exeRead("usuarios", "WHERE id = :id", "id={$user}");
                if ($read->getResult()) {
                    $messages[$user] = ["usuario" => $read->getResult()[0], "bloqueado" => 0, "pendente" => 0, "silenciado" => 0, "home" => HOME];
                    $messages[$user]['usuario']['imagem'] = (!empty($messages[$user]['usuario']['imagem']) ? json_decode($messages[$user]['usuario']['imagem'], !0)[0]['url'] : HOME . "assetsPublic/img/img.png");

                    foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$user}/pending/{$_SESSION['userlogin']['id']}") as $message) {
                        $mensagem = json_decode(file_get_contents(PATH_HOME . "_cdn/chat/{$user}/pending/{$_SESSION['userlogin']['id']}/{$message}"), !0);
                        $messages[$user]['lastMessage'] = "<span style='color: #999'>eu: </span>" . $mensagem['mensagem'];
                        $messages[$user]['ultima_vez_online'] = $mensagem['data'];
                    }
                }
            }
        }
    }

    /**
     * Convert lista de objetos referenciados pelo id do usuário em lista
     */
    foreach ($messages as $datum)
        $data['data'][] = $datum;
}