#!/bin/bash
# Creates custom local repository for ZBarCam etc.

set -xe

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

sudo pacman -Sy --noconfirm --needed devtools arch-install-scripts wget

# Video4Linux Loopback
( cd $CWD/packages/v4l2loopback && extra-x86_64-build )
( cd $CWD/packages/v4l2loopback && extra-i686-build )

# NodeWebKit
( cd $CWD/packages/nwjs && extra-x86_64-build )
( cd $CWD/packages/nwjs && extra-i686-build )
