<?php
/**
 * Search for pending messages to recovery
 */
$data['data'] = 0;
if (file_exists(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending"))
    $data['data'] = count(\Helpers\Helper::listFolder(PATH_HOME . "_cdn/chat/{$_SESSION['userlogin']['id']}/pending"));