<?php

use Conn\Create;
use Conn\Read;
use Conn\Update;

/**
 * Send the message to database
 * @param int $user
 * @param array $mensagens
 */
function addMessageToMysql(int $user, array $mensagens)
{
    if (!empty($mensagens)) {
        $read = new Read();
        $read->exeRead("messages_user", "WHERE usuario = :id", "id={$user}");
        if ($read->getResult()) {
            //update chat dialog

            $messages_user = $read->getResult()[0];

            /**
             * Check if the another user blocked the chat
             */
            $read->exeRead("messages_user", "WHERE ownerpub = :id AND usuario = :me AND bloqueado = 1", "id={$user}&me={$_SESSION['userlogin']['id']}", !0);

            /**
             * Check if the user blocked the chat
             */
            if (!$read->getResult() && $messages_user['bloqueado'] == 0) {

                /**
                 * Find message data dialog
                 */
                $read->exeRead("messages", "WHERE id = :idm", "idm={$messages_user['mensagem']}");
                if ($read->getResult()) {

                    /**
                     * Update message data diaolog
                     */
                    $messages = json_decode($read->getResult()[0]['messages'], !0);
                    foreach ($mensagens as $msg) {
                        $messages[] = [
                            "mensagem" => $msg['mensagem'],
                            "usuario" => $msg['usuario'],
                            "data" => date("Y-m-d H:i:s", $msg['data'])
                        ];
                    }

                    /**
                     * Update mysql with new message data dialog
                     */
                    $up = new Update();
                    $up->exeUpdate("messages", ['messages' => json_encode($messages)], "WHERE id = :ui", "ui={$read->getResult()[0]['id']}");
                }
            }

        } else {
            //create
            $create = new Create();

            /**
             * Create message data dialog
             */
            $messages = [];

            /**
             * Search for messages on the other user
             */
            if (file_exists(PATH_HOME . "_cdn/chat/{$user}/pending/" . $_SESSION['userlogin']['id'])) {
                foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$user}/pending/" . $_SESSION['userlogin']['id']) as $item) {
                    $m = json_decode(file_get_contents(PATH_HOME . "_cdn/chat/{$user}/pending/{$_SESSION['userlogin']['id']}/{$item}"), !0);
                    $m["data"] = date("Y-m-d H:i:s", $m['data']);
                    $messages[] = $m;
                    unlink(PATH_HOME . "_cdn/chat/{$user}/pending/{$_SESSION['userlogin']['id']}/{$item}");
                }
                rmdir(PATH_HOME . "_cdn/chat/{$user}/pending/" . $_SESSION['userlogin']['id']);
            }

            /**
             * add messages received by param
             */
            foreach ($mensagens as $msg) {
                $messages[] = [
                    "mensagem" => $msg['mensagem'],
                    "usuario" => $msg['usuario'],
                    "data" => date("Y-m-d H:i:s", $msg['data'])
                ];
            }

            $create->exeCreate("messages", ['messages' => json_encode($messages)]);

            if ($create->getResult()) {
                $messageId = $create->getResult();

                /**
                 * Create personal user message track with the message data dialog
                 */
                $create->exeCreate("messages_user", [
                    "usuario" => $user,
                    "ownerpub" => $_SESSION['userlogin']['id'],
                    "mensagem" => $messageId
                ]);

                /**
                 * Create personal user message track with the message data dialog to the user target
                 */
                $create->exeCreate("messages_user", [
                    "usuario" => $_SESSION['userlogin']['id'],
                    "ownerpub" => $user,
                    "mensagem" => $messageId
                ]);
            }
        }
    }
}

$mensagens = [];
if (!empty($_SESSION['userlogin']) && !empty($_SESSION['userlogin']['token']) && !empty($variaveis[0])) {
    $user = $variaveis[0];

    /**
     * Search for writing status
     */
    if (file_exists(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/{$user}.txt")) {
        $mensagens[] = ["mensagem" => "~^", "usuario" => $user, "data" => file_get_contents(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/{$user}.txt")];
        unlink(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/{$user}.txt");
    }

    /**
     * Search for pending messages to send to user
     */
    $mensagensSend = [];
    if (file_exists(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/" . $user)) {
        foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/" . $user) as $item) {
            $mensagensSend[] = json_decode(file_get_contents(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$user}/{$item}"), !0);
            unlink(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/{$user}/{$item}");
        }

        rmdir(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending/" . $user);
        addMessageToMysql($user, $mensagensSend);

        foreach ($mensagensSend as $item)
            $mensagens[] = $item;
    }
}

$data['data'] = $mensagens;