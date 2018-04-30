'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.0/routing
|
*/

const Config = use('Config')
const Route = use('Route')

Route
.group(() => {
  Route.get('account', 'ApiV1Controller.getAccount')
  Route.get('recommendations', 'ApiV1Controller.getRecommendations')
  Route.get('timeline', 'ApiV1Controller.getTimeline')
  Route.get('users/:id', 'ApiV1Controller.getUser')
})
.prefix('api/v1')

Route.get('/', async ({ view }) => {
  return view.render('welcome', { tokenCookieName: Config.get('happn.tokenCookie') })
})

Route.get('/timeline', async ({ request, response, view }) => {
  const token = request.plainCookie(Config.get('happn.tokenCookie'))
  if(!token)
  {
    return response.redirect('/')
  }
  return view.render('timeline', { MAPBOX_TOKEN: Config.get('happn.mapboxToken') })
})
