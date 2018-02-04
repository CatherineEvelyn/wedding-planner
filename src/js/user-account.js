$(document).ready(function() {

var globalModal = $('.global-modal');
    $( ".overlay" ).on( "click", function() {
      $( globalModal ).toggleClass('global-modal-show');
    });
    $( ".global-modal_close" ).on( "click", function() {
      $( globalModal ).toggleClass('global-modal-show');
    });
    $(".mobile-close").on("click", function(){
      $( globalModal ).toggleClass('global-modal-show');
    });

//To call specific Modal to open when a specific button is clicked
    $( "#venueButton" ).on( "click", function(e) {
      e.preventDefault();
      $( venueModal ).toggleClass('global-modal-show');
    });

    $( "#photoButton" ).on( "click", function(e) {
      e.preventDefault();
      $( photoModal ).toggleClass('global-modal-show');
    });

    $( "#videoButton" ).on( "click", function(e) {
      e.preventDefault();
      $( videoModal ).toggleClass('global-modal-show');
    });    

    $( "#catererButton" ).on( "click", function(e) {
      e.preventDefault();
      $( catererModal ).toggleClass('global-modal-show');
    });

    $( "#musicButton" ).on( "click", function(e) {
      e.preventDefault();
      $( musicModal ).toggleClass('global-modal-show');
    });

    $( "#hairButton" ).on( "click", function(e) {
      e.preventDefault();
      $( cosmeticsModal ).toggleClass('global-modal-show');
    });

    $( "#tailorButton" ).on( "click", function(e) {
      e.preventDefault();
      $( tailorModal ).toggleClass('global-modal-show');
    });

})

