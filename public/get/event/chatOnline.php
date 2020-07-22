<?php

/**
 * Update status online
 */
if (!empty($_SESSION['userlogin']) && !empty($_SESSION['userlogin']['token']) && !empty($variaveis[0])) {
    $up = new Update();
    $up->exeUpdate("messages_user", ["ultima_vez_online" => date("Y-m-d H:i:s")], "WHERE ownerpub = :me AND usuario = :u AND bloqueado = 0", "me={$_SESSION['userlogin']['id']}&u={$variaveis[0]}");
}