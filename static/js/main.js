var api_call_made = false;
var vendorID = null;
var sessionDetails = null;
var vendors = [];
var bookedVendors = [];
var queryResults = [];
var isActiveSearch = false;

$(function () {
  retrieveBookedVendors();
  getSessionDetails();
  addDismissNotificationListeners();
  addMobileMenuListener();
  addSignupListener();
  addBlur();
  addAjaxListeners();
  addSearchListener();
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

function retrieveBookedVendors() {
  $.ajax({
    method: "GET",
    url: "/getvendors",
    data: {
      booked: "true"
    },
    global: false
  })
  .done(json => {
    bookedVendors = json;
    updateBookingNotifiers(bookedVendors);
  })
  .fail(err => {
    console.log(err);
  });
}

function updateBookingNotifiers(json) {
  $.each(json, (index, value) => {
    let $card = $(".vendor-list-card").find(`[data-vendor-id='${value}']`);
    if ($card.find(".booked").length === 0) {
      $card.find(".book-button").remove();
      $card.find("footer").prepend(
        $('<span />', {"class": "card-footer-item has-text-success booked"}).append(
          $('<span />', {"class": "icon"}).append(
            $('<i />', {"class": "mdi mdi-check-circle"})
          )
        ).append(" Booked")
      )
    }
  });
}

function addAjaxListeners() {
  $('.getVendorByType').on('click', e => {
    let $self = $(e.currentTarget);
    let type = $self.attr('data-type');

    if (type === "all") {
      history.pushState({}, document.title, window.location.href.split('#')[0]);
    }

    api_call_made = true;
    $('.sortVendors').removeClass('is-active');
    makeSidelinkActive(type);
    getVendorByType(type);
  });

  $('.sortVendors').on('click', e => {
    let $self = $(e.currentTarget);
    let type = $self.attr('data-type');
    let order = $self.attr('data-order');
    let sortTarget = queryResults.length === 0 ? vendors : queryResults;
    $('.sortVendors').removeClass('is-active');
    $self.addClass('is-active');
    $('.sortVendors').children().eq(0).remove();

    if (order == 'asc') {
      sortTarget = sortArray(sortTarget, type, 'asc')
      $self.attr("data-order", 'desc');
      $self.append(
        $('<span />', {"class": "icon is-small"}).append(
          $('<i />', {"class": "mdi mdi-arrow-up"})
        )
      );
    } else {
      sortTarget = sortArray(sortTarget, type, 'desc')
      $self.attr("data-order", 'asc');
      $self.append(
        $('<span />', {"class": "icon is-small"}).append(
          $('<i />', {"class": "mdi mdi-arrow-down"})
        )
      );
    }
    displayVendors(sortTarget);
  });
}

function sortArray(arr, type, order){
  arr.sort(function(a, b){
      // a and b will here be two objects from the array
      // thus a[1] and b[1] will equal the names
      // if they are equal, return 0 (no sorting)
      if (a[type] == b[type]) { 
        return 0; 
      }
      if (a[type] > b[type]) {
        // if a should come after b, return 1
        if (order == 'asc') {
          return 1;
        } else {
          return -1;
        }
      } else {
        // if b should come after a, return -1
        if (order == 'asc') {
          return -1;
        } else {
          return 1;
        }
      }
  });
  return arr;
}

var delay = (function() {
  var timer = 0;
  return function(callback, ms) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();

function addSearchListener() {
  $("#vendorSearch").on('keyup', e => {
    let $self = $(e.currentTarget);
    $('.overlay-container').show();
    $('.vendor-list-card .overlay').show();
    delay(() => {
      isActiveSearch = $self.val() === "" ? false : true;
      filterArray($self.val());
      $('.overlay-container').hide();
      $('.vendor-list-card .overlay').hide();
    }, 1000);
  });
}

function filterArray(query) {
  // Checking to see if anything is in the input box
  if (isActiveSearch) {
    queryResults = []
    $.each(vendors, (idx, entry) => {
      // Cycling through entries in each vendor object. If a match is detected in
      // any of the fields (contact name, business name, address) except email,
      // it will be added to the queryResults array, then displayed in the view.
      for (const [key, value] of Object.entries(entry)) {
        if (key != "email" && typeof value == "string") {
          if (value.toLowerCase().indexOf(query.toLowerCase()) > -1) {
            queryResults.push(entry);
            break;
          }
        }
      }
    });
    displayVendors(queryResults);
  } else if (!isActiveSearch) {
    // Showing all results in selected category if there was once an active search and input is now blank
    queryResults = [];
    displayVendors(vendors);
  }
}

function getVendorByType(type) {
  // First unbind other ajax call animation from document
  $(document).unbind("ajaxStart.bookingCall");
  $(document).unbind("ajaxStop.bookingCall");
  // Adding loading indicators for loading vendors call
  $(document).bind("ajaxStart.vendorCall", () => {
    $('.overlay-container').show();
    $('.vendor-list-card .overlay').show();
  });
  $(document).bind("ajaxStop.vendorCall", () => {
    $('.overlay-container').hide();
    $('.vendor-list-card .overlay').hide();
  });

  makeSidelinkActive(type);

  $.ajax({
    method: 'GET',
    url: '/getvendors',
    data: {
      "type": type
    },
    success: data => {
      vendors = [];
      // Convert JSON into an array
      for(let vendor in data.vendors){
        vendors.push(data.vendors[vendor]);
      }
    }
  })
  .done(json => {
    query = $("#vendorSearch").val();

    if (query) {
      filterArray(query);
    } else {
      displayVendors(vendors);
    }
    api_call_made = false;
  })
  .fail((xhr, status, error) => {
    console.log(xhr, status, error);
  })
}

function makeSidelinkActive(type) {
  // Remove all active classes from links
  $('.getVendorByType').removeClass('is-active');
  // Add active class to all vendors link (special case)
  if (type === "all") {
    $('.getVendorByType').eq(0).addClass('is-active');
  }
  // Add active class to link with href that corresponds to type passed in to AJAX call
  $('a[href="#' + type + '"]').addClass('is-active');
}

function displayVendors(arr) {
  let $wrapper = $(".vendor-list-card-wrapper")

  $wrapper.empty();
  // Use global vendors to allow local sorting
  $.each(arr, function(index, value) {
    let $vendorCardWrapper = $("<div />", {"class": "tile is-parent vendor-list-card"});
    let $card = $("<article />", {"class": "tile is-child card"}).attr("data-vendor-id", value.id);

    $card.append('<div class="overlay"></div>');

    $card.append(
      $('<div />', {"class": "card-content"}).append(
        $('<div />', {"class": "media"}).append(
          $('<div />', {"class": "media-content"}).append(
            $('<p />', {"class": "title is-3 vendorName"}).text(value.contactName),
            $('<p />', {"class": "subtitle is-5 vendorType"}).text(value.vendorType)
          )
        ),
        $('<div />', {"class": "content"}).append(
          $('<p />', {"class": "businessName"}).text(value.businessName),
          $('<p />', {"class": "vendorLocation"}).text(value.city + ", " + value.state),
          $("<p />").append(
            $("<small />", {"html": 'Rating: ' + value.rating})
          ),
          $("<p />").append(
            $("<small />", {"html": 'Price/Rate: $' + value.price + ".00"})
          )
        )
      ),
      $('<footer />', {"class": "card-footer"}).append(
        $('<a />', {"class": "card-footer-item book-button"}).append(
          $('<span />', {"class": "icon"}).append(
            $('<i />', {"class": "mdi mdi-plus-circle"})
          )
        ).append(" Book Now"),
        $('<a />', {"class": "card-footer-item"}).attr("href", "/portfolio").append(
          $('<span />', {"class": "icon"}).append(
            $('<i />', {"class": "mdi mdi-treasure-chest"})
          )
        ).append(" View Portfolio")
      )
    );
    $vendorCardWrapper.append($card);
    $wrapper.append($vendorCardWrapper);
  });
  updateBookingNotifiers(bookedVendors);
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
    if (sessionDetails.session === false) {
      alert("You must be logged in to book a vendor.");
    } else {
      $('#bookingModal').addClass('is-active');
      vendorID = $(e.currentTarget).parent().parent().attr('data-vendor-id');
      $('#bookRequestName').val($(e.currentTarget).parent().siblings('.card-content').find('.vendorName').text());
      $('#bookRequestBusiness').val($(e.currentTarget).parent().siblings('.card-content').find('.businessName').text());
      // Adding DatePicker each time a booking modal is active
      var datePicker = new DatePicker(document.getElementById('bookRequestDate'), {dataFormat: "yyyy-mm-dd"});
    }
  });
}

function addCloseModalListeners() {
  $(document).on('click', '#modalCloseButton, #modalCloseLayer, #cancelButton', e => {
    $('#bookingModal').removeClass('is-active');
    $('.datepicker').remove();
    $('#bookRequestDate').val("");
    resetModalView();
  });
}

function addBookFulfillmentListener() {
  $('#bookVendor').on('click', e => {
    let vendorId = vendorID;
    let date = $('#bookRequestDate').val();
    postBookRequest(vendorId, date);
  });
}

function postBookRequest(id, date) {
  // First unbind main ajax animation from happening
  $(document).unbind("ajaxStart.vendorCall");
  $(document).unbind("ajaxStop.vendorCall");
  // Adding loading indicators for booking call
  $(document).bind("ajaxStart.bookingCall", () => {
    $('.modal-card-body .overlay').fadeTo("fast", 0.75);
    $('#bookVendor').addClass('is-loading');
  });
  $(document).bind("ajaxStop.bookingCall", () => {
    $('.modal-card-body .overlay').fadeOut("fast");
    $('#bookVendor').removeClass('is-loading');
    console.log('complete!');
  });
  $.ajax({
    method: "POST",
    url: "/book",
    data: {
      "vendorID": id,
      "date": date
    }
  })
  .done(json => {
    displayBookingConfirmation(json, id);
    console.log(json);
  })
  .fail((xhr) => {
    displayErrorMessage(xhr.responseJSON.message);
  });
}

function displayBookingConfirmation(json, id) {
  const info = json.bookingInfo;

  $('.bookingInputBox, #bookingFooter').hide();

  $('#bookingInfoBox').append($('<p class="subtitle detail">').text(info.book_date));
  $('#vendorBusinessBox').append($('<p class="subtitle detail">').text(info.vendor_business));
  $('#vendorNameBox').append($('<p class="subtitle detail">').text(info.vendor_name));

  $('.confirmationMessage, #confirmFooter').show();
  bookedVendors.push(id);
  updateBookingNotifiers(bookedVendors);
}

function displayErrorMessage(err) {
  $('.bookingInputBox, #bookingFooter').hide();

  $('.errorMessage').append('<p class="subtitle">' + err + '</p>');

  $('.errorMessage, #confirmFooter').show();
}

function resetModalView() {
  const $inputView = $('.bookingInputBox, #bookingFooter');
  const $confirmView = $('.confirmationMessage, #confirmFooter');
  const $errorView = $('.errorMessage');

  $inputView.show();
  $confirmView.hide();
  $errorView.hide();
  $('.detail').remove();
}

function getSessionDetails() {
  $.ajax({
    method: "GET",
    url: "/session",
    data: {
      "source": "ajax"
    }
  }).done(data => {
    sessionDetails = data;
    console.log(data);
  });
}

function addDismissNotificationListeners() {
  $('.flash-dismiss').on('click', e => {
    $(e.currentTarget).parent().remove();
  });
}
