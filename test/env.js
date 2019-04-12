/**
 * sets up test environment
 */

const { resolve } = require('path')
const { exec, test, mkdir } = require('shelljs')

const tmpDir = process.env.TMP_DIR = '/tmp/gfs-downloader'
const grib2Json = resolve(__dirname, '../grib2json')
process.env.GRIB2JSON_PATH = resolve(grib2Json, 'bin/grib2json')

if (!test('-d', tmpDir)) {
  mkdir('-p', tmpDir)
}
if (!test('-d', grib2Json)) { // download and compile grib2json
  mkdir('-p', grib2Json)
  exec(`${__dirname}/../scripts/grib2json.sh`)
}
