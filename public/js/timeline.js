'use strict';

// Anonymous, self-executing document-ready
(function(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
})(async function(){

  const apiResponse = await fetch('/api/v1/timeline', {
    cache: 'no-cache',
    credentials: 'same-origin', // <- make fetch() include cookies in the req
    headers: {'accept': 'application/json','content-type': 'application/json'}
  })
  .then((response) => response.json())
  .catch((err) => console.error(err))

  if(apiResponse.error) return console.error(apiResponse.error.message, apiResponse.error)

  const dataset = new vis.DataSet(apiResponse.map((encounter, i) => {
    encounter.start = new Date(encounter.last)
    return encounter
  }))

  // DOM element where the Timeline will be attached
  const visContainer = document.getElementById('visualization')

  // Configuration for the Timeline
  const timelineOptions = {
    template: (encounter, element, data) => {
      element.classList.add('photo')
      element.style.backgroundImage = `url(${encounter.photo})`

      return `<div>
        <h3><a href="https://www.google.com/maps/place/${encounter.lat},${encounter.lng}" target="_blank">${encounter.name}</a></h3>
      </div>`
    },
    height: '400px',
    width: '100%',
    /**
     * The zooming is weird in that it sets the min/max amount of time you can
     * see ACROSS the screen, rather than the unit of time used in the grid.
     * For responsive websites this means smaller screens will have trouble zooming.
     */
    zoomMax: (1000*60*60*24*7),
    zoomMin: (1000*60)
  };

  // Create a Timeline
  const timeline = new vis.Timeline(visContainer, dataset, timelineOptions);

  // Default to latest 24h
  timeline.setWindow((new Date)-86400000, (new Date))

  //TODO: change the size of items based on how far zoomed we are?
  timeline.on('rangechanged', function (e) {
    // Only react to changes made by the user
    if(e.byUser)
    {
      //TODO: check if we need to request more encounters
      console.log('rangechanged', e)
    }
    //TODO: this should trigger a repaint in gmaps
  });
})
