<?php

/**
 * Search for pending messages to recovery
 */
$data['data'] = [];
if (file_exists(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending")) {
    $read = new \Conn\Read();
    foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending") as $item) {
        $read->exeRead("usuarios", "WHERE id = :id", "id={$item}");
        if($read->getResult()) {
            $data['data'][$item] = ["usuario" => $read->getResult()[0], "bloqueado" => 0, "pendente" => 0, "isPendente" => !0, "silenciado" => 0, "home" => HOME];
            $data['data'][$item]['usuario']['imagem'] = (!empty($data['data'][$item]['usuario']['imagem']) ? json_decode($data['data'][$item]['usuario']['imagem'], !0)[0]['url'] : HOME . "assetsPublic/img/img.png");
            foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$item}") as $message) {
                $mensagem = json_decode(file_get_contents(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$item}/{$message}"), !0);
                $data['data'][$item]['lastMessage'] = $mensagem['mensagem'];
                $data['data'][$item]['ultima_vez_online'] = $mensagem['data'];
                $data['data'][$item]['pendente']++;
            }
        }
    }
}