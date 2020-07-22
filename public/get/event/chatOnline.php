<?php

/**
 * Update status online
 */
if (!empty($_SESSION['userlogin']) && !empty($_SESSION['userlogin']['token']) && !empty($variaveis[0])) {
    $up = new \Conn\Update();
    $up->exeUpdate("messages_user", ["ultima_vez_online" => date("Y-m-d H:i:s")], "WHERE ownerpub = {$variaveis[0]} && usuario = {$_SESSION['userlogin']['id']} && bloqueado = 0");

    $read = new \Conn\Read();
    $read->exeRead("messages_user", "WHERE usuario = :u AND bloqueado = 0", "u={$variaveis[0]}");
    $data['data'] = $read->getResult() ? $read->getResult()[0]['ultima_vez_online'] : "";
}