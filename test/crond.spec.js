import assert from 'assert'
import { Config, bootstrap, disconnect, download, cleanup } from '..'
import { config } from './fixtures/mongo.js'

describe('gfs-crond', function () {
  before(() => {
    Config.set(config)
  })

  before(function () {
    bootstrap()
  })
  after(function () {
    disconnect()
  })

  describe('download', function () {
    this.timeout(10000)
    const now = new Date()
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0))

    it('shall download data', function () {
      const options = Object.assign({ date }, config.crontab.download.options)
      return download(options)
        .then(() => {

        })
        .catch(err => {
          assert.ok(err, err)
        })
    })
  })

  describe('cleanup', function () {
    this.timeout(10000)

    it('shall cleanup data', function () {
      const { options } = config.crontab.cleanup
      return cleanup(options)
        .then((results) => {
          assert.ok(Array.isArray(results), 'shall be an array')
          assert.ok(results[0].deletedCount >= 60000, 'shall delete more than 60000 points')
        })
        .catch(err => {
          assert.ok(err, err)
        })
    })
  })
})
