<?php

use Conn\Read;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

$user = filter_input(INPUT_POST, 'usuario', FILTER_VALIDATE_INT);
$mensagem = trim(filter_input(INPUT_POST, 'mensagem', FILTER_DEFAULT));

if(!empty($_SESSION['userlogin']) && !empty($_SESSION['userlogin']['token']) && !empty($user)) {
    $read = new Read();
    \Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat");
    \Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat/" . $user);
    \Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat/" . $user . "/pending");
    \Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat/" . $user . "/pending/" . $_SESSION['userlogin']['id']);

    /**
     * Create a file that store the message to the user
     * this store say to user that have pending messages
     */
    $read->exeRead("messages_user", "WHERE ownerpub = :user AND usuario = :me", "user={$user}&me={$_SESSION['userlogin']['id']}", !0);
    $m = ($read->getResult() ? $read->getResult()[0] : ["silenciado" => 0, 'bloqueado' => 0]);

    if($m['bloqueado'] == 0) {
        $f = fopen(PATH_HOME . "_cdn/chat/" . $user . "/pending/" . $_SESSION['userlogin']['id'] . "/" . strtotime('now') . "-" . rand(99999, 999999) . ".txt", "w+");
        fwrite($f, json_encode(["mensagem" => $mensagem, "usuario" => $_SESSION['userlogin']['id'], "data" => strtotime('now')]));
        fclose($f);

        /**
         * Check if the user accept Notification
         */
        if($m['silenciado'] == 0 && defined("PUSH_PUBLIC_KEY") && !empty(PUSH_PUBLIC_KEY) && defined("PUSH_PRIVATE_KEY") && !empty(PUSH_PRIVATE_KEY)) {

            $dia = date("Y-m-d");
            $isSendNotification = !file_exists(PATH_HOME . "_cdn/userActivity/" . $_SESSION['userlogin']['id'] . "/{$dia}.json");

            if(!$isSendNotification) {
                $day = json_decode(file_get_contents(PATH_HOME . "_cdn/userActivity/" . $_SESSION['userlogin']['id'] . "/{$dia}.json"), !0);
                $isSendNotification = (strtotime($dia . ' ' . $day[count($day) - 1]) < strtotime('now') - 5);
            }

            if($isSendNotification) {
                $read->exeRead("push_notifications", "WHERE usuario = :u", "u={$user}");
                if ($read->getResult()) {

                    $webPush = new WebPush([
                        'VAPID' => [
                            'subject' => HOME,
                            'publicKey' => PUSH_PUBLIC_KEY, // don't forget that your public key also lives in app.js
                            'privateKey' => PUSH_PRIVATE_KEY, // in the real world, this would be in a secret file
                        ]
                    ]);

                    $webPush->sendNotification(
                        Subscription::create(json_decode($read->getResult()[0]['subscription'], !0)),
                        json_encode(
                            [
                                "id" => time(),
                                "title" => $_SESSION['userlogin']['nome'],
                                "body" => $mensagem,
                                "badge" => HOME . "assetsPublic/img/favicon.png?v=" . VERSION,
                                "data" => HOME . "mensagem/" . $_SESSION['userlogin']['id'],
                                "icon" => !empty($_SESSION['userlogin']['imagem']) ? $_SESSION['userlogin']['imagem'][0]['url'] : HOME . "assetsPublic/img/favicon.png",
                                "imagem" => ""
                            ]
                        )
                    );

                    foreach ($webPush->flush() as $report)
                        $endpoint = $report->getRequest()->getUri()->__toString();
                }
            }
        }
    }
}