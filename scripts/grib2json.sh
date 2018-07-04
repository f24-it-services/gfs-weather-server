#!/bin/bash

CWD=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

cd $CWD/.. \
  && git clone https://github.com/cambecc/grib2json.git \
  && cd grib2json \
  && mvn package \
  && mv target/grib2json-*.tar.gz ../ \
  && cd .. \
  && rm -rf grib2json \
  && tar xvzf grib2json-*.tar.gz \
  && rm grib2json-*.tar.gz \
  && mv grib2json-* grib2json
