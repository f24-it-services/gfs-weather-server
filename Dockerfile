FROM ubuntu:latest
MAINTAINER jklose@f24.com

# Create a non-privileged user
RUN groupadd -r wg --gid=1000 && useradd -r -g wg --uid=1000 wg

# Install basic dependencies: node, maven, jdk
RUN apt-get update && \
  apt-get upgrade -y && \
  apt-get install -y build-essential curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs maven git default-jdk-headless

RUN mkdir -p /home/wg
RUN mkdir -p /tmp/gfs-downloader

# Need to build & install the grib2json tool via git & maven
RUN cd /home/wg && \
  git clone https://github.com/cambecc/grib2json.git && \
  cd grib2json && \
  mvn package && \
  mv target/grib2json-*.tar.gz ../ && \
  cd .. && \
  rm -rf grib2json && \
  tar xvzf grib2json-*.tar.gz && \
  rm grib2json-*.tar.gz &&  \
  mv grib2json-* grib2json

# Install our own node module
COPY . /home/wg/node
COPY config/production.json /home/wg/node/config.json

RUN chown -R wg:wg /home/wg
RUN chown -R wg:wg /tmp/gfs-downloader

USER wg

WORKDIR /home/wg/node

RUN npm i

ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/jre
ENV GRIB2JSON_PATH /home/wg/grib2json/bin/grib2json
ENV NODE_ENV production
ENV DEBUG gfs*

EXPOSE 8080

ENTRYPOINT ["npm", "run"]
