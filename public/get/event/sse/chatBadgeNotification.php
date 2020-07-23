<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

/**
 * Send message to front
 * @param string $msg
 * @param null $id
 */
function sendMsg(string $msg, $id = null)
{
    echo "id: " . ($id ?? time()) . PHP_EOL;
    echo "retry: 3000" . PHP_EOL;
    echo "data: $msg" . PHP_EOL;
    echo PHP_EOL;
    ob_flush();
    flush();
}

/**
 * Search for pending messages to recovery
 */
if (file_exists(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending"))
    sendMsg(count(\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending")));
else
    sendMsg(0);