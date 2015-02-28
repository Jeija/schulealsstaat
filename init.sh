#!/bin/bash
# Initializes environment for SaS server / client development, installs dependencies
# (Cordova init must be done seperately as it depends on the target platform)

# Abort if run as root
if [ $(id -u) -eq 0 ]
then
	echo "This script mustn't be run as root. Aborting."
	exit 1
fi

set -xe

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

$CWD/installdeps.sh
$CWD/prepare.sh
