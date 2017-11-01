$(document).ready(function() {


// -- JS for vendor confirm display --//
$("#venueButton").click(function(){
    $('#venueStatus').toggleClass('is-selected')
    let x = $("#venueButton")
    if (x.text() == "Confirm") {
        x.text('Cancel')
    } else {
        x.text('Confirm')
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
