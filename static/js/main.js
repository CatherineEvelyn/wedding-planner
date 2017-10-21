var api_call_made = false;
$(function () {
  addMobileMenuListener();
  addSignupListener();
  addBlur();
  addAjaxListeners();
  addCloseModalListeners();
  addBookingListeners();
  addBookFulfillmentListener();
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
  $(document).on('click', '.book-button', e => {
    $('#bookingModal').addClass('is-active');
    // Adding DatePicker each time a booking modal is active
    var datePicker = new DatePicker(document.getElementById('bookRequestDate'), {dataFormat: "yyyy-mm-dd"});
  });
}

function addCloseModalListeners() {
  $(document).on('click', '#modalCloseButton, #modalCloseLayer, #cancelButton', e => {
    $('#bookingModal').removeClass('is-active');
    $('.datepicker').remove();
    $('#bookRequestDate').val("");
  });
}

function addBookFulfillmentListener() {
  $('#bookVendor').on('click', e => {
    name = "Test" //$('#bookRequestName').val();
    email = "Test" //$('#bookRequestEmail').val();
    date = $('#bookRequestDate').val();
    postBookRequest(name, email, date);
  })
}

function postBookRequest(name, email, date) {
  $.ajax({
    method: "POST",
    url: "/book",
    data: {
      "name": name,
      "email": email,
      "date": date
    }
  }).done(json => {
    displayBookingConfirmation(json);
    console.log(json);
  });
}
