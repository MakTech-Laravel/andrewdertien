<?php

$pdf = file_get_contents(__DIR__.'/client-attachments/Askupon.pdf');

preg_match_all('/\(((?:\\\\.|[^\\\\)])*)\)\s*Tj/s', $pdf, $matches);

$out = '';
foreach ($matches[1] as $text) {
    $out .= stripcslashes($text);
}

echo $out, PHP_EOL;
