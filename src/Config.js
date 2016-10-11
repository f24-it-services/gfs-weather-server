let config

export default {
  get () {
    if (!config) {
      throw new Error(
        'Missing configuration. Call Config.set() to properly intialize'
      )
    }
    return config
  },

  set (newConfig) {
    if (config) {
      throw new Error('Configuration alreeady set.')
    }
    config = newConfig
  },

  initialized () {
    return !!config
  }
}
