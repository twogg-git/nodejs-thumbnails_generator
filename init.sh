#!/bin/bash

 echo 'Installing modules...'
 cd /opt/thumbnailer; npm install
 
 echo 'Starting app...'
 cd /opt/thumbnailer; node app.js
