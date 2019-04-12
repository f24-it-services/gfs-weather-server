export const config = {
  server: { // server port
    port: '8080'
  },
  db: 'mongoose', // database driver for mongo-db
  mongoose: {
    connString: process.env.DATABASE_URL || 'mongodb://localhost/gfs', // database URL
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
        fileTTL: 0,
        dataSetTTL: 0,
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
