$(document).ready(function() {

var globalModal = $('.global-modal');
    $( ".btn-green-flat-trigger" ).on( "click", function(e) {
      e.preventDefault();
      $( globalModal ).toggleClass('global-modal-show');
    });
    $( ".overlay" ).on( "click", function() {
      $( globalModal ).toggleClass('global-modal-show');
    });
    $( "#venueButton" ).on( "click", function() {
      $( globalModal ).toggleClass('global-modal-show');
    });
    $(".mobile-close").on("click", function(){
      $( globalModal ).toggleClass('global-modal-show');
    });

// -- JS for vendor confirm display --//
$("#venueButton").click(function(){
    $('#venueStatus').toggleClass('is-selected')
    let x = $("#venueChange")
    if (x.text() == "Find") {
        x.text('Cancel')
    } else {
        x.text('Find')
    }
})

$("#photoButton").click(function(){
    $('#photoStatus').toggleClass('is-selected')
    let x = $("#photoButton")
    if (x.text() == "Confirm") {
        x.text('Cancel')
    } else {
        x.text('Confirm')
    }
})

$("#videoButton").click(function(){
    $('#videoStatus').toggleClass('is-selected')
    let x = $("#videoButton")
    if (x.text() == "Confirm") {
        x.text('Cancel')
    } else {
        x.text('Confirm')
    }
})

$("#catererButton").click(function(){
    $('#catererStatus').toggleClass('is-selected')
    let x = $("#catererButton")
    if (x.text() == "Confirm") {
        x.text('Cancel')
    } else {
        x.text('Confirm')
    }
})

$("#bandButton").click(function(){
    $('#bandStatus').toggleClass('is-selected')
    let x = $("#bandButton")
    if (x.text() == "Confirm") {
        x.text('Cancel')
    } else {
        x.text('Confirm')
    }
})

$("#hairButton").click(function(){
    $('#hairStatus').toggleClass('is-selected')
    let x = $("#hairButton")
    if (x.text() == "Confirm") {
        x.text('Cancel')
    } else {
        x.text('Confirm')
    }
})

$("#tailorButton").click(function(){
    $('#tailorStatus').toggleClass('is-selected')
    let x = $("#tailorButton")
    if (x.text() == "Confirm") {
        x.text('Cancel')
    } else {
        x.text('Confirm')
    }
})

})

