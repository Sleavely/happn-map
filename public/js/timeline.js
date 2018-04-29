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
    return {
      start: new Date(encounter.last),
      content: encounter.name
    }
  }))

  // DOM element where the Timeline will be attached
  const visContainer = document.getElementById('visualization')

  // Configuration for the Timeline
  const timelineOptions = {};

  // Create a Timeline
  const timeline = new vis.Timeline(visContainer, dataset, timelineOptions);
})
