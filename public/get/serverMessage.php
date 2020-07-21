<?php
$app = new \Ratchet\App('localhost', 9999);
$app->route("/mensagem/chat", new \Chat\ChatServer, ['*']);
$app->run();