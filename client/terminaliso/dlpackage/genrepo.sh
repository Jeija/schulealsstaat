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

### Generate NoWifi Package from WiFi base package ###
echo "Making NoWifi package..."
mkdir -p /tmp/terminal_nowifi
cp -R /tmp/terminal_wifi/* /tmp/terminal_nowifi
touch /tmp/terminal_nowifi/disable_wifi

### Generate (compress + sign) Packages ###
echo "Generating packages..."
$CWD/genpackage.sh /tmp/terminal_wifi $CWD/dlrepo/terminal_wifi
$CWD/genpackage.sh /tmp/terminal_nowifi $CWD/dlrepo/terminal_nowifi

### Clean up ###
echo "Cleaning up..."
rm -r /tmp/terminal_wifi
rm -r /tmp/terminal_nowifi
echo "Done!"
