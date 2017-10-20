// Adding DatePicker and calendar styling
var datePicker = new DatePicker(document.getElementById('bookDatePicker'), {dataFormat: "yyyy-mm-dd"});

var api_call_made = false;
$(function () {
  addMobileMenuListener();
  addSignupListener();
  addBlur();
  addAjaxListeners();
  addCloseModalListeners();
});

function addSignupListener() {
  $('.toggle-form').click(e => {
    let $self = $(e.currentTarget);

    $('.toggle-form').parent().removeClass('is-active');
    $self.parent().addClass('is-active');

    if ($self.hasClass('show-vendor')) {
      $('.vendor-signup').show();
      $('.organizer-signup').hide();
      $('.signup-container').addClass('expanded-form');
    } else {
      $('.vendor-signup').hide();
      $('.organizer-signup').show();
      $('.signup-container').removeClass('expanded-form');
    }
  })
}

function addBlur() {
  $('.vendor-card').on({
    mouseover: e => {
      let $self = $(e.currentTarget);
      $self.children('.vendor-card-image').addClass('in-focus');
      $self.children('.vendor-icon').addClass('slide-up');
      $self.children('.vendor-text').addClass('text-shown');
    },
    mouseleave: e => {
      let $self = $(e.currentTarget);
      $self.children('.vendor-card-image').removeClass('in-focus');
      $self.children('.vendor-icon').removeClass('slide-up');
      $self.children('.vendor-text').removeClass('text-shown');
    }
  });
}

function addAjaxListeners(){
  $('.getVendorByType').on('click', e => {
    let $self = $(e.currentTarget);
    api_call_made = true;
    getVendorByType($self.attr('data-type'));
  })
}

function getVendorByType(type){
  $.ajax({
    method: 'GET',
    url: '/getvendors',
    data: {
      "type": type
    }
  })
  .done(json => {
    displayVendors(json);
    console.log(json);
    api_call_made = false;
  })
}

function displayVendors(json) {
  let $wrapper = $(".vendor-list-card-wrapper")

  $wrapper.empty();

  $.each(json.vendors, function(index, value) {
    let $vendorCardWrapper = $("<div />", {"class": "tile is-parent vendor-list-card"});
    let $card = $("<article />", {"class": "tile is-child notification is-info"});

    $card.append(
      $("<button />", {"class": "delete is-medium book-button"}),
      $("<p />", {"class": "title", "html": value.contactName}),
      $("<p />", {"class": "subtitle", "html": value.vendorType}),
      $("<p />", {"html": value.businessName}),
      $("<p />").append(
        $("<small />", {"html": value.streetAddress})
      ),
      $("<p />").append(
        $("<small />", {"html": value.city + ", " + value.state})
      )
    );
    $vendorCardWrapper.append($card);
    $wrapper.append($vendorCardWrapper);
  });

  // Add listeners for newly-created booking buttons
  addBookingListeners();
}

function addMobileMenuListener() {
  // Get all "navbar-burger" elements
  var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {

    // Add a click event on each of them
    $navbarBurgers.forEach(function ($el) {
      $el.addEventListener('click', function () {

        // Get the target from the "data-target" attribute
        var target = $el.dataset.target;
        var $target = document.getElementById(target);

        // Toggle the class on both the "navbar-burger" and the "navbar-menu"
        $el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }
}

function addBookingListeners() {
  $('.book-button').on('click', e => {
    $('#bookingModal').addClass('is-active');
  });
}

function addCloseModalListeners() {
  $('#modalCloseButton, #modalCloseLayer').on('click', e => {
    $('#bookingModal').removeClass('is-active');
    datePicker.hide();
  });
}
