<?php
$p = new Phar('C:/ProgramData/ComposerSetup/bin/composer.phar');
file_put_contents('_locker.php', $p['src/Composer/Package/Locker.php']->getContent());
echo "ok\n";
