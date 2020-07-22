<?php

$user = filter_input(INPUT_POST, 'usuario', FILTER_VALIDATE_INT);
$mensagem = trim(filter_input(INPUT_POST, 'mensagem', FILTER_DEFAULT));

if(!empty($_SESSION['userlogin']) && !empty($_SESSION['userlogin']['token']) && !empty($user)) {
    \Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat");
    \Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat/" . $user);
    \Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat/" . $user . "/pending");
    \Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat/" . $user . "/pending/" . $_SESSION['userlogin']['id']);

    /**
     * Create a file that store the message to the user
     * this store say to user that have pending messages
     */
    $f = fopen(PATH_HOME . "_cdn/chat/" . $user . "/pending/" . $_SESSION['userlogin']['id'] . "/" . strtotime('now') . "-" . rand(99999, 999999) . ".txt", "w+");
    fwrite($f, json_encode(["mensagem" => $mensagem, "usuario" => $_SESSION['userlogin']['id'], "data" => strtotime('now')]));
    fclose($f);
}