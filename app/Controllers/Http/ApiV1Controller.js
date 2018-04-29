'use strict'

const Config = use('Config')
const { HappnWrapper } = require('happn-wrapper')

const COOKIE_NAME = Config.get('happn.tokenCookie')

class ApiV1Controller {

  /**
   * Middleware-like token extraction and API client initializer
   */
  async apiClient({ request })
  {
    // plainCookie() because this cookie isnt encrypted by Adonis
    const token = request.plainCookie(COOKIE_NAME)
    if(!token) throw new Error('E_COOKIE_TOKEN')

    const happn = new HappnWrapper()
    await happn.authorize(token)
    return happn
  }


  async getRecommendations({ request })
  {
    let happn = await this.apiClient({ request })
    let result = await happn.getRecommendations()
    return result
  }

  async getTimeline({ request })
  {
    let result = await this.getRecommendations({ request })
    result = result.data.map((encounter) => {
      return {
        userId: encounter.notifier.id,
        name: encounter.notifier.first_name,
        photo: encounter.notifier.profiles[0].url,
        lat: encounter.notifier.last_meet_position.lat,
        lng: encounter.notifier.last_meet_position.lon,
        last: encounter.notifier.last_meet_position.modification_date
      }
    })
    return result
  }

  async getAccount({ request })
  {
    let happn = await this.apiClient({ request })
    const result = await happn.getAccount()
    return result
  }

  async getUser({ request, params })
  {
    let happn = await this.apiClient({ request })
    const result = await happn.getUser(params.id)
    return result
  }


}

module.exports = ApiV1Controller
