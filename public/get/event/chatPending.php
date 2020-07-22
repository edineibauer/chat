<?php

/**
 * Search for pending messages to recovery
 */
$user = $variaveis[0];
$data['data'] = [];
if (file_exists(PATH_HOME . "_cdn/chat/{$user}/pending/" . $_SESSION['userlogin']['id'])) {
    foreach (\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$user}/pending/" . $_SESSION['userlogin']['id']) as $item)
        $data['data'][] = json_decode(file_get_contents(PATH_HOME . "_cdn/chat/{$user}/pending/{$_SESSION['userlogin']['id']}/{$item}"), !0);
}