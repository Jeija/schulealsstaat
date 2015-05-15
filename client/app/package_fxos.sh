#!/bin/bash
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

rm -rf /tmp/hgc_fxos
rm -rf /tmp/package.zip
mkdir -p /tmp/hgc_fxos
cp -R $CWD/www /tmp/hgc_fxos
cp -R $CWD/manifest.webapp /tmp/hgc_fxos
cp -R $CWD/icon.png /tmp/hgc_fxos
cp -R $CWD/icon128.png /tmp/hgc_fxos

rm -r /tmp/hgc_fxos/www/QRScanJS/.git
rm -r /tmp/hgc_fxos/www/bower_components/jsencrypt/demo
rm -r /tmp/hgc_fxos/www/bower_components/jsencrypt/test
rm -r /tmp/hgc_fxos/www/bower_components/jsencrypt/lib
rm /tmp/hgc_fxos/www/bower_components/jsencrypt/jquery.js
rm /tmp/hgc_fxos/www/bower_components/jsencrypt/example.html
rm /tmp/hgc_fxos/www/bower_components/jsencrypt/index.html
rm /tmp/hgc_fxos/www/bower_components/jsencrypt/bin/jsencrypt.js
rm /tmp/hgc_fxos/www/bower_components/gibberish-aes/dist/gibberish-aes-1.0.0.js
rm /tmp/hgc_fxos/www/spec.html
rm /tmp/hgc_fxos/www/QRScanJS/decoder.js
rm /tmp/hgc_fxos/www/QRScanJS/example.html
rm -r /tmp/hgc_fxos/www/bower_components/gibberish-aes/test
rm /tmp/hgc_fxos/www/bower_components/jquery/src/ -r

cd /tmp/hgc_fxos && zip -r /tmp/package.zip *

echo "Done!"
echo "Package file is at /tmp/package.zip"
