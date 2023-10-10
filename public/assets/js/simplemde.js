let SimpleMDE = require('../assets/vendors/simplemde/simplemde.min.js')

$(function() {
  'use strict';
  /*simplemde editor*/
  if ($("#simpleMdeExample").length) {
    var simplemde = new SimpleMDE({
      element: $("#simpleMdeExample")[0]
    });
  }


  
});