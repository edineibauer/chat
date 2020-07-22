<?php

\Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat");
\Helpers\Helper::createFolderIfNoExist(PATH_HOME . "_cdn/chat/" . $variaveis[0]);

/**
 * Create a file that say the user is writing
 * the user destination will remove it later
 */
$f = fopen(PATH_HOME . "_cdn/chat/" . $variaveis[0] . "/" . $_SESSION['userlogin']['id'] . ".txt", "w+");
fwrite($f, strtotime('now'));
fclose($f);