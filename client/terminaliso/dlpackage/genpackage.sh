#!/bin/bash
# Usage: genpackage.sh [source directory][output file]

set -e
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EMAIL=cag@mesecons.net

echo "-------------------------------"
echo "Creating package $2..."

if [ "$#" -ne 2 ]; then
	echo "Usage: genpackage.sh [source directory][output file]"
	echo "After compression + signing, the output file will be called"
	echo "<output filename>.pkg.gpg"
	exit 1
fi

echo "Compressing package..."
cd $1 && tar zcf /tmp/genpackage_tmp.pkg . && cd $CWD

echo "Signing package..."
gpg -u $EMAIL --batch --yes --output $2.pkg.gpg --sign /tmp/genpackage_tmp.pkg

echo "Cleaning up..."
rm /tmp/genpackage_tmp.pkg

echo "Package creation complete!"
echo "-------------------------------"
