'use strict'

const Env = use('Env')

module.exports = {
  // Name of the cookie where we store the token
  tokenCookie: 'hmfbt',

  mapboxToken: Env.get('MAPBOX_TOKEN', '')
}
