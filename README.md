# gfs-weather-server

Backend for downloading, storing and serving meteorological data.

## Installation

    git clone ...

## Configuration

Copy `config.sample.json` to `config.json` and adjust the settings to your environment.

```javascript
{
  "server": {
    // Configuration settings affecting the restify instance
    "port": 8080
  },
  // Toggle between mongoose for a mongodb database or sequelize for sql databases
  "db": "mongoose",
  "mongoose": {
    "connString": "mongodb://localhost/gfs"
  },
  // Sequelize settings. modelOptions get passed to every model.
  // Globally override settings like the schema for postgres.
  "sequelize": {
    "user": "gfs",
    "database": "gfs",
    "password": "foo",
    "options": {
      "host": "localhost",
      "port": 5432,
      "dialect": "postgres"
    },
    "modelOptions": {
      "schema": "weather",
      "underscored": true
    }
  },
  // Settings for the gfs downloader job.
  "downloader": {
    // Predefine the minimum start date when downloading. Defaults to the newest available files.
    "latestUpdate": null,
    // Where to store downloaded gfs files
    "target": "/tmp/gfs-downloader",
    // Which offset (in hours) to start downloading forecasts (multiple of 3)
    "forecastStart": 0,
    // Maximum offset of forecasts (multiple of 3)
    "forecastEnd": 72,
    // Fields (based on grib index files) to be downloaded.
    "fields": [{
        // If field names are given as array, they are combined into a single grid after downloading
        "name": ["UGRD", "VGRD"],
        "combinedName": "UVGRD",
        // The surface as defined in the grib index
        "surface": "10 m above ground",
        // The resolution in degrees. Can be 2.5, 1, 0.5 or 0.25.
        // Only 1 degree is supported at the moment
        "resolution": 1
      }, {
        "name": "TMP",
        "surface": "surface",
        "resolution": 1
      }, {
        "name": "PRATE",
        "surface": "surface",
        // For non-regular grids, define "to-regular" as a post-processing step.
        // This converts and downsamples (if needed) gaussian grids to regular latlng grids
        "process": ["to-regular", 90, 0, 1, 1, 360, 181]
      }
    ]
  }
}
```

## Usage

### Standalone server

    docker build gfs-server:latest .
    docker run -i -t gfs-server:latest start

### Cronjobs

    docker build gfs-server:latest .
    docker run -i -t gfs-server:latest crond


#### Manually run a cron job

    docker run -i -t gfs-server:latest crond -- --run-once download
