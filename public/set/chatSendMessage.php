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

    /**
     * Check if the user accept Notification
     */
    $read = new \Conn\Read();
    $read->exeRead("messages_user", "WHERE ownerpub = :user AND usuario = :me AND silenciado = 0", "user={$user}&me={$_SESSION['userlogin']['id']}", !0);
    if($read->getResult()) {

        /**
         * Notify user from new message incoming from this user
         */
        $note = new \Dashboard\Notification();
        $note->setUsuarios($user);
        $note->setTitulo($_SESSION['userlogin']['nome']);
        $note->setDescricao($mensagem);
        $note->setImagem(!empty($_SESSION['userlogin']['imagem']) ? $_SESSION['userlogin']['imagem'][0]['url'] : HOME . "assetsPublic/img/favicon.png");
        $note->setUrl(HOME . "mensagem/" . $_SESSION['userlogin']['id']);
        $note->enviar();
    }
}