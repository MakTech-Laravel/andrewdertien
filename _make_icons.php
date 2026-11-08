<?php

$s = 180;
$im = imagecreatetruecolor($s, $s);
imagesavealpha($im, true);
$trans = imagecolorallocatealpha($im, 0, 0, 0, 127);
imagefill($im, 0, 0, $trans);

$navy = imagecolorallocate($im, 11, 61, 110);
$pink = imagecolorallocate($im, 255, 107, 181);
$pink2 = imagecolorallocate($im, 255, 141, 200);
$yellow = imagecolorallocate($im, 255, 213, 74);
$blue = imagecolorallocate($im, 125, 211, 252);

imagefilledrectangle($im, 0, 0, $s, $s, $navy);
imagefilledellipse($im, 90, 138, 100, 28, $blue);
imagefilledellipse($im, 90, 86, 34, 70, $pink);
imagefilledellipse($im, 78, 92, 28, 58, $pink2);
imagefilledellipse($im, 102, 92, 28, 58, $pink2);
imagefilledellipse($im, 90, 86, 18, 18, $yellow);

imagepng($im, __DIR__.'/public/apple-touch-icon.png');
imagepng($im, __DIR__.'/public/favicon-32.png');
copy(__DIR__.'/public/favicon-32.png', __DIR__.'/public/favicon.ico');
imagedestroy($im);

echo "icons ok\n";
