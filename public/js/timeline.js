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
    }
  };

  // Create a Timeline
  const timeline = new vis.Timeline(visContainer, dataset, timelineOptions);
})
