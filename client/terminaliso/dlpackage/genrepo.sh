#!/bin/bash
# Automatically copies all relevant files for the default packages and creates them

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

### WiFi base package ###
echo "Copying base package..."
mkdir -p /tmp/terminal_wifi
cp -R $CWD/basepkg/* /tmp/terminal_wifi

### Userterminal ###
echo "Copying userterminal..."
cp -R $CWD/../../userterminal /tmp/terminal_wifi
mv /tmp/terminal_wifi/userterminal/package.json.production /tmp/terminal_wifi/userterminal/package.json

### Generate (compress + sign) Packages ###
echo "Generating package..."
$CWD/genpackage.sh /tmp/terminal_wifi $CWD/dlrepo/terminal_wifi

### Clean up ###
echo "Cleaning up..."
rm -r /tmp/terminal_wifi
echo "Done!"
