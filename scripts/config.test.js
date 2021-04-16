// this function cannot merge arrays
function merge (to, from) {
  for (const p in from) {
    if (typeof from[p] === 'object') {
      if (!to[p]) to[p] = {}
      to[p] = merge(to[p], from[p])
    } else {
      to[p] = from[p]
    }
  }
  return to
}

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/gfs'
let envConfig = {}

if (process.env.NODE_CONFIG) {
  envConfig = new Function('return ' + process.env.NODE_CONFIG)() // eslint-disable-line no-new-func
  console.log(envConfig)
}

const config = {
  server: { // server port - not used here
    port: '8080'
  },
  db: 'mongoose', // database driver for mongo-db
  mongoose: {
    connString: DATABASE_URL, // database URL
    options: {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    }
  },
  crontab: {
    cleanup: { // cleanup dates
      schedule: '0 3 * * *', // every day at 3AM - see `man 5 crontab`
      options: {
        fileTTL: 172800000,
        dataSetTTL: 172800000,
        downloaderTarget: '/tmp/gfs-downloader'
      }
    },
    download: { // start download of new dataset
      schedule: '0 0,3,6,9,12,15,18,21 * * *', // every day each 3hours - see `man 5 crontab`
      options: {
        latestUpdate: null,
        target: '/tmp/gfs-downloader',
        forecastStart: 0,
        forecastEnd: 1, // number of hours to download (3days)
        fields: [
          { // Temperature at 2m above ground
            name: 'TMP',
            surface: '2 m above ground',
            resolution: 1
          }
        ]
      }
    }
  }
}

module.exports = merge(config, envConfig)

if (module === require.main) {
  console.log(JSON.stringify(module.exports, null, 2)) // eslint-disable-line no-console
}
