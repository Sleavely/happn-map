'use strict';

// Anonymous, self-executing document-ready
(function(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
})(async function(){

  const hm = new HappnMap;
  let dataset = await hm.init()



  //TODO: change the size of items based on how far zoomed we are?
  hm.timeline.on('rangechanged', function (e) {
    // Only react to changes made by the user
    if(e.byUser)
    {
      //TODO: check if we need to request more encounters
      console.log('rangechanged', e)
    }
    //TODO: this should trigger a repaint in gmaps
  });
})

class HappnMap {
  constructor(options)
  {
    const defaults = {
      recommendationsLimit: 16,
      recommendationsOffset: 0,
      timelineElementId: 'visualization',
      timelineWidth: '100%',
      timelineHeight: '400px'
    }
    this.options = Object.assign({}, defaults, options || {})
  }

  async init()
  {
    await this.initDataset()
    await this.initTimeline()
    await this.initMap()
    this.syncMap()

    this.timeline.on('rangechanged', (e) => {
      // Only react to changes made by the user
      if(e.byUser) this.syncMap()
    })
  }

  async initDataset()
  {
    this.dataset = new vis.DataSet()
    await this.getEncounters()
  }

  async initTimeline()
  {
    this.timelineOptions = {
      template: this.renderTimelineItem,
      width: this.options.timelineWidth,
      height: this.options.timelineHeight,
      // The zooming is weird in that it sets the min/max amount of time you can
      // see ACROSS the screen, rather than the unit of time used in the grid.
      // For responsive websites this means smaller screens will have trouble zooming.
      zoomMax: (1000*60*60*24*7),
      zoomMin: (1000*60)
    };
    this.visContainer = document.getElementById(this.options.timelineElementId)
    this.timeline = new vis.Timeline(this.visContainer, this.dataset, this.timelineOptions)
    // Default to latest 24h
    this.timeline.setWindow((new Date)-86400000, (new Date))
  }

  async initMap()
  {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [-65.017, -16.457],
      zoom: 5
    })
    this.markers = []
  }

  async fetch(uri, opts)
  {
    const defaultOpts = {
      cache: 'no-cache',
      credentials: 'same-origin', // <- make fetch() include cookies in the req
      headers: {'accept': 'application/json','content-type': 'application/json'}
    }
    const finalOpts = Object.assign({}, defaultOpts, opts || {})
    const apiResponse = await fetch(uri, finalOpts)
      .then((response) => response.json())
      .catch((err) => console.error(err))
    if(apiResponse.error) throw new Error(apiResponse.error)
    return apiResponse
  }

  /**
   * Request encounters from the API.
   *
   * @param {Number} limit
   * @param {Number} offset
   * @returns {Array}
   */
  async getEncounters(limit, offset)
  {
    if(!limit) limit = this.options.recommendationsLimit
    if(!offset) offset = this.options.recommendationsOffset

    const response = await this.fetch(`/api/v1/timeline?limit=${limit}&offset=${offset}`)

    // Add to the dataset
    const formattedData = response.map((encounter, i) => {
      encounter.start = new Date(encounter.last)
      delete encounter.last
      return encounter
    })

    //TODO: we should make sure we arent adding duplicates
    this.dataset.add(formattedData)
    return this.dataset
  }

  renderTimelineItem(encounter, element, data)
  {
    element.classList.add('photo')
    element.style.backgroundImage = `url(${encounter.photo})`

    return `<div>
      <h3><a href="https://www.google.com/maps/place/${encounter.lat},${encounter.lng}" target="_blank">${encounter.name}</a></h3>
    </div>`
  }

  renderMapMarker(encounter)
  {
    let el = document.createElement('div')
    el.classList.add('marker')
    el.classList.add('photo')
    el.style.backgroundImage = `url(${encounter.photo})`

    el.addEventListener('click', () => {
      window.alert(encounter.name);
    });

    // add marker to map
    return new mapboxgl.Marker(el)
      .setLngLat([encounter.lng, encounter.lat])
      .addTo(this.map);
  }

  /**
   * Add any items that arent already on the map, fit map to the markers in the range
   */
  syncMap()
  {
    //TODO: Clean items from map?
    this.markers.forEach((marker) => {
      marker.remove()
    })
    this.markers = []

    let maxLat = undefined
    let minLat = undefined
    let maxLng = undefined
    let minLng = undefined

    //TODO: get visible items from timeline
    const visible = this.timeline.getVisibleItems()
    visible.forEach((datasetId) => {
      let encounter = this.dataset.get(datasetId)
      this.markers.push( this.renderMapMarker(encounter) )
      if(typeof maxLat == 'undefined' || encounter.lat > maxLat) maxLat = encounter.lat
      if(typeof minLat == 'undefined' || encounter.lat < minLat) minLat = encounter.lat
      if(typeof maxLng == 'undefined' || encounter.lng > maxLng) maxLng = encounter.lng
      if(typeof minLng == 'undefined' || encounter.lng < minLng) minLng = encounter.lng
    })
    //TODO: Then for each encounter
    //TODO: fit-to-markers
    if(this.markers.length)
    {
      this.map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: {top: 20, bottom:50, left: 30, right: 30}
      })
    }
  }
}
