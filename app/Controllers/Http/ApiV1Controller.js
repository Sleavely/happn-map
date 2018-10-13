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

    const query = request.get()
    const limit = parseInt(query.limit || 16, 10)
    const offset = parseInt(query.offset || 0, 10)

    let fields = [
      'id',
      'lat',
      'lon',
      'modification_date',
      'notification_type',
      'nb_times',
      'notifier.fields('+[
        'id',
        'first_name',
        'last_name',
        'gender',
        'age',
        'job',
        'workplace',
        'about',
        'school',
        'availability',
        'clickable_profile_link',
        'clickable_message_link',
        'distance',
        'already_charmed',
        'has_charmed_me',
        'is_accepted',
        'is_charmed',
        'is_invited',
        'last_invite_received',
        'my_conversation',
        'my_relation',
        'nb_photos',
        //'role',
        'type',
        'last_meet_position.fields('+[
          'lat',
          'lon',
          'creation_date',
          'modification_date'
        ].join(',')+')',
        'profiles.mode(1).width(360).height(640).fields('+[
          'width',
          'height',
          'mode',
          'url'
        ].join(',')+')',
        'social_synchronization.fields(instagram)',
        'spotify_tracks',
        'fb_id',
        'twitter_id',
      ].join(',')+')'
    ].join(',')

    const options = {
      url: `https://api.happn.fr/api/users/${happn._userId}/crossings`,
      headers: {
        'Authorization': `OAuth="${happn._accessToken}"`
      },
      qs: {
        offset,
        limit,
        fields
      },
      json: true
    }

    let res = await happn._request.get(options)
    return res.body
  }

  async getTimeline({ request })
  {
    let result = await this.getRecommendations({ request })
    result = result.data.map((encounter) => {
      return {
        id: encounter.notifier.id,
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
