#!/bin/bash

CWD=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
TMP_DIR=/tmp/gfs-downloader

test ! -d $CWD/../grib2json && $CWD/grib2json.sh
test ! -d $TMP_DIR && mkdir -p $TMP_DIR

export GRIB2JSON_PATH=./grib2json/bin/grib2json
export DEBUG=gfs*

./bin/gfs-weather-crond.js --config $CWD/config.test.js --run-once download --date $(date +%Y-%m-%dT00:00:00Z)
./bin/gfs-weather-crond.js --config $CWD/config.test.js --run-once cleanup
