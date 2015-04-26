#!/bin/bash
# File copying only
set -xe

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."

# Copy api.js to all client applications that use it
cp $ROOT/client/common/api.js $ROOT/client/userterminal/site/
cp $ROOT/client/common/api.js $ROOT/client/registration/site/
cp $ROOT/client/common/api.js $ROOT/client/genrequest/site/
cp $ROOT/client/common/api.js $ROOT/client/adminpanel/site/
cp $ROOT/client/common/api.js $ROOT/client/entrycheck/site/
cp $ROOT/client/common/api.js $ROOT/client/app/www/js/
cp $ROOT/client/common/api.js $ROOT/testing/api/

# Copy cert.js + logging.js to all server applications that use it
cp $ROOT/server/common/cert.js $ROOT/server/api/cert.js
cp $ROOT/server/common/cert.js $ROOT/server/webcam/cert.js
cp $ROOT/server/common/logging.js $ROOT/server/api/logging.js
cp $ROOT/server/common/logging.js $ROOT/server/webcam/logging.js
cp $ROOT/server/common/logging.js $ROOT/network/dns/logging.js
