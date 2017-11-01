$(document).ready(function() {

$("#photoButton").click(function(){
    $('#photoStatus').toggleClass('is-selected')
    let x = $("#photoButton")
    if (x.text() == "Find") {
        x.text('Confirm')
    } else {
        x.text('Find')
    }



})
})
