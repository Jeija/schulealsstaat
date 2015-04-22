#!/bin/bash
# This installs crosswalk to benefit from the blink rendering engine

if [ -z "$JAVA_HOME" ]; then
	echo "Please set JAVA_HOME, something like:"
	echo "  $ export JAVA_HOME=/usr/lib/jvm/java-7-openjdk"
	exit 1
fi

if [ -z "$1" ]; then
	echo "You must specify an architecture to install crosswalk for"
	echo "Usage:"
	echo "  $ crosswalk.sh <arch>"
	echo "Valid architectures are: arm x86"
	exit 1
fi

set -e

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VERSION="11.40.277.7"
ARCH=$1

# Clean up
cd $CWD && cordova platform remove android || true
cd $CWD && cordova platform add android

# Get Crosswalk and copy files
curl https://download.01.org/crosswalk/releases/crosswalk/android/stable/$VERSION/$ARCH/crosswalk-cordova-$VERSION-$ARCH.zip > /tmp/crosswalk_cordova_$ARCH.zip
rm -rf /tmp/crosswalk-cordova-$VERSION-$ARCH
unzip /tmp/crosswalk_cordova_$ARCH.zip -d /tmp
rm -rf $CWD/platforms/android/CordovaLib/*
cp -a /tmp/crosswalk-cordova-$VERSION-$ARCH/framework/* $CWD/platforms/android/CordovaLib
cp -a /tmp/crosswalk-cordova-$VERSION-$ARCH/VERSION $CWD/platforms/android
rm -r $CWD/platforms/android/CordovaLib/res/*

# Get permissions for Crosswalk
sed -i '/<\/manifest>/i \
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" /> \
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />' $CWD/platforms/android/AndroidManifest.xml

# Build crosswalk etc.
export ANDROID_HOME=$(dirname $(dirname $(which android)))
cd $CWD/platforms/android && android update project --subprojects --path . --target "android-21"
cd $CWD/platforms/android/CordovaLib && ant debug

echo "Migration to Crosswalk $ARCH builds complete, you can now execute"
echo "  $ cordova build android"
echo "to build the app for android."
