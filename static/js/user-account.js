$(document).ready(function() {

var globalModal = $('.global-modal');
    $( ".btn-green-flat-trigger" ).on( "click", function(e) {
      e.preventDefault();
      $( globalModal ).toggleClass('global-modal-show');
    });
    $( ".overlay" ).on( "click", function() {
      $( globalModal ).toggleClass('global-modal-show');
    });
    $( ".global-modal_close" ).on( "click", function() {
      $( globalModal ).toggleClass('global-modal-show');
    });
    $(".mobile-close").on("click", function(){
      $( globalModal ).toggleClass('global-modal-show');
    });

// -- JS for vendor confirm display --//
$("#outsideVendor").click(function(){
    let x = $("#venueButton")
    if (x.text() == "Find") {
        x.text('Cancel')
    } else {
        x.text('Find')
    }
})

$("#photoButton").click(function(){
    let x = $("#photoButton")
    if (x.text() == "Find") {
        x.text('Cancel')
    } else {
        x.text('Find')
    }
})

$("#videoButton").click(function(){
    let x = $("#videoButton")
    if (x.text() == "Find") {
        x.text('Cancel')
    } else {
        x.text('Find')
    }
})

$("#catererButton").click(function(){
    let x = $("#catererButton")
    if (x.text() == "Find") {
        x.text('Cancel')
    } else {
        x.text('Find')
    }
})

$("#bandButton").click(function(){
    let x = $("#bandButton")
    if (x.text() == "Find") {
        x.text('Cancel')
    } else {
        x.text('Find')
    }
})

$("#hairButton").click(function(){
    let x = $("#hairButton")
    if (x.text() == "Find") {
        x.text('Cancel')
    } else {
        x.text('Find')
    }
})
$("#tailorButton").click(function(){
    let x = $("#tailorButton")
    if (x.text() == "Find") {
        x.text('Cancel')
    } else {
        x.text('Find')
    }
})

})

