#!/bin/bash
# Creates custom local repository for ZBarCam etc.
set -e

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Install all packages in CWD/packages
for PKG in $CWD/packages/*; do
	echo "Building: $PKG"
	( cd $PKG && extra-x86_64-build )
	( cd $PKG && extra-i686-build )
done

# Create custom repository
mkdir -p $CWD/repo
mkdir -p $CWD/repo/x86_64
mkdir -p $CWD/repo/i686
find $CWD/packages -name '*any.pkg.tar.xz' -exec cp '{}' $CWD/repo/x86_64 \;
find $CWD/packages -name '*any.pkg.tar.xz' -exec cp '{}' $CWD/repo/i686 \;
find $CWD/packages -name '*x86_64.pkg.tar.xz' -exec cp '{}' $CWD/repo/x86_64 \;
find $CWD/packages -name '*i686.pkg.tar.xz' -exec cp '{}' $CWD/repo/i686 \;
repo-add $CWD/repo/x86_64/schulealsstaat.db.tar.gz $CWD/repo/x86_64/*.pkg.tar.xz
repo-add $CWD/repo/i686/schulealsstaat.db.tar.gz $CWD/repo/i686/*.pkg.tar.xz

# Add custom local repository to ISO build
echo -e "[schulealsstaat]" > $CWD/iso/pacman.schulealsstaat.conf
echo -e "SigLevel = Optional TrustAll" >> $CWD/iso/pacman.schulealsstaat.conf
echo -e "Server = file://$CWD/repo/\$arch" >> $CWD/iso/pacman.schulealsstaat.conf
