#!/bin/bash
# Prepare environment for building the ISO
set -e

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

sudo pacman -Sy --noconfirm --needed devtools arch-install-scripts wget archiso

$CWD/localrepo.sh
$CWD/genkeys.sh
