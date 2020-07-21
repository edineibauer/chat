<?php

/**
 * get last message send
 */
$mensagem = json_decode($dados['messages'], !0);
$mensagem = $mensagem[count($mensagem) - 1];

/**
 * Retrieve the user message to check if its silence option is checked
 */
$read = new \Conn\Read();
$read->exeRead("messages_user", "WHERE mensagem = :m AND ownerpub = :o AND usuario = :me AND silenciado = 0", "m={$dados['id']}&o={$mensagem['usuario']}&me={$_SESSION['userlogin']['id']}", !0);
if($read->getResult()) {

    /**
     * Notify user from new message incoming from this user
     */
    $note = new \Dashboard\Notification();
    $note->setUsuarios($mensagem['usuario']);
    $note->setTitulo($_SESSION['userlogin']['nome']);
    $note->setDescricao($mensagem['messages']);
    $note->setImagem(!empty($_SESSION['userlogin']['imagem']) ? $_SESSION['userlogin']['imagem'][0]['urls']['thumb'] : HOME . "assetsPublic/img/favicon.png");
    $note->setUrl(HOME . "mensagem/" . $_SESSION['userlogin']['id']);
    $note->enviar();

}

/**
 * Notify each admin from the new message incoming
 */
/*$read->exeRead("administrador", "WHERE ativo = 1");
if($read->getResult()) {
    $admins = [1];
    foreach ($read->getResult() as $adm)
        $admins[] = $adm['usuarios_id'];

    $note->setUsuarios($admins);
    $note->enviar();
}*/