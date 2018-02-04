import stickybits from "stickybits";
import { DatePicker } from "./datepicker.js";

var API_CALL_MADE = false;
var VENDOR_ID = null;
var VENDORS = [];
var BOOKED_VENDORS = [];
var QUERY_RESULTS = [];
var IS_ACTIVE_SEARCH = false;
var CURRENT_VENDORS_TOTAL = 0;
var RESULTS_PER_PAGE = 18;

$(function() {
  retrieveBookedVendors();
  addAjaxListeners();
  addSearchListener();
  addDropdownMenuListeners();
  addBookingListeners();
  addBookFulfillmentListener();
  addCloseModalListeners();

  var loc, tag;
  
  update_tag();
  
  $(window).on('popstate', e => {
    update_tag();
  });
  
  function update_tag() {
    loc = window.location.href.split('#');
    tag = loc.length > 1 ? loc[1] : '';
    if (tag != '' && !API_CALL_MADE) {
      getVendorByType(tag);
    } else if (!tag) {
      getVendorByType("all");
    }
  }
  
  // Adding position:sticky polyfill for side menu to make sure it works in older browers
  var elements = $('.sticky');
  stickybits(elements, {stickyBitStickyOffset: 67});
});

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
    BOOKED_VENDORS = json;
    updateBookingNotifiers(BOOKED_VENDORS);
  })
  .fail(err => {
    console.log(err);
  });
}

function addDropdownMenuListeners() {
  $(document).on("click", ".card-dropdown", e => {
    closeDropdowns();
    e.stopPropagation();
    $(e.currentTarget).toggleClass("is-active");
  });
  $(document).on("click", e => {
    closeDropdowns();
  });
}

function closeDropdowns() {
  $(".card-dropdown").removeClass("is-active");
}

function updateBookingNotifiers(json) {
  $.each(json, (index, value) => {
    let $card = $(".vendor-list-card").find(`[data-vendor-id='${value}']`);
    if ($card.find(".booked").length === 0) {
      $card.find(".book-button").remove();
      $card.find(".dropdown-content").prepend(
        $('<span />', {"class": "dropdown-item has-text-success booked"}).append(
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

    API_CALL_MADE = true;
    $('.sortVendors').removeClass('is-active');
    makeSidelinkActive(type);
    getVendorByType(type);
  });

  $('.sortVendors').on('click', e => {
    let $self = $(e.currentTarget);
    let type = $self.attr('data-type');
    let order = $self.attr('data-order');
    let sortTarget = QUERY_RESULTS.length === 0 ? VENDORS : QUERY_RESULTS;
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

const delay = (function() {
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
      IS_ACTIVE_SEARCH = $self.val() === "" ? false : true;
      filterArray($self.val());
      $('.overlay-container').hide();
      $('.vendor-list-card .overlay').hide();
    }, 700);
  });
}

function filterArray(query) {
  // Checking to see if anything is in the input box
  if (IS_ACTIVE_SEARCH) {
    QUERY_RESULTS = []
    $.each(VENDORS, (idx, entry) => {
      // Cycling through entries in each vendor object. If a match is detected in
      // any of the fields (contact name, business name, address) except email,
      // it will be added to the QUERY_RESULTS array, then displayed in the view.
      for (const [key, value] of Object.entries(entry)) {
        if (key != "email" && typeof value == "string") {
          if (value.toLowerCase().indexOf(query.toLowerCase()) > -1) {
            QUERY_RESULTS.push(entry);
            break;
          }
        }
      }
    });
    displayVendors(QUERY_RESULTS);
  } else if (!IS_ACTIVE_SEARCH) {
    // Showing all results in selected category if there was once an active search and input is now blank
    QUERY_RESULTS = [];
    displayVendors(VENDORS);
  }
}

function getVendorByType(type) {
  // Show AJAX loading animation

  $('.overlay-container').show();
  $('.vendor-list-card .overlay').show();

  makeSidelinkActive(type);

  var t0 = performance.now();
  $.ajax({
    method: 'GET',
    url: '/getvendors',
    data: {
      "type": type
    },
    success: data => {
      var t1 = performance.now();
      console.log("Call to get vendors took " + (t1 - t0) + " milliseconds.")
      updateResultsCount(data);
      VENDORS = [];
      // Convert JSON into an array
      for(let vendor in data.vendors){
        VENDORS.push(data.vendors[vendor]);
      }
    }
  })
  .done(json => {
    $(".vendor-list-card-wrapper").empty().hide(); // Empty out vendor list display
    let query = $("#vendorSearch").val();

    if (query) {
      filterArray(query);
    } else {
      displayVendors(VENDORS);
    }

    // Infinite Scroll Prototype

    $(window).scroll(e => {
      if ($(window).scrollTop() + $(window).height() > $(document).height() - 180) {
        console.log("near bottom; load more vendors");
        displayVendors(VENDORS);
      }
    });
    
    // Hide AJAX loading animation

    $('.overlay-container').hide();
    $('.vendor-list-card .overlay').hide();

    API_CALL_MADE = false;
  })
  .fail((xhr, status, error) => {
    console.log(xhr, status, error);
  });
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

function updateResultsCount(json) {
  $('#vendorTotal').text(
    Object.keys(json.vendors).length
  );
}

function changePage(page) {
  let stoppingPoint = CURRENT_VENDORS_TOTAL + RESULTS_PER_PAGE;

  
}

function displayVendors(arr) {
  let $wrapper = $(".vendor-list-card-wrapper");
  let stoppingPoint = CURRENT_VENDORS_TOTAL + RESULTS_PER_PAGE;

  const icons = {
    "venue": `<svg class="card-icon" viewBox="0 0 20 20" preserveAspectRation="xMinYMin meet">
                <path fill="#FFFFFF" d="m10,18a8,8 0 0 1 -8,-8a8,8 0 0 1 8,-8a8,8 0 0 1 8,8a8,8 0 0 1 -8,8m0,-18a10,10 0 0 0 -10,10a10,10 0 0 0 10,10a10,10 0 0 0 10,-10a10,10 0 0 0 -10,-10m0,10.5a1.5,1.5 0 0 1 -1.5,-1.5a1.5,1.5 0 0 1 1.5,-1.5a1.5,1.5 0 0 1 1.5,1.5a1.5,1.5 0 0 1 -1.5,1.5m0,-5.3c-2.1,0 -3.8,1.7 -3.8,3.8c0,3 3.8,6.5 3.8,6.5c0,0 3.8,-3.5 3.8,-6.5c0,-2.1 -1.7,-3.8 -3.8,-3.8z"></path>
              </svg>`,
    "photographer": `<svg class="card-icon" viewBox="0 0 20 18" preserveAspectRatio="xMinYMid meet">
                       <path fill="#FFFFFF" d="m2,2l3,0l2,-2l6,0l2,2l3,0a2,2 0 0 1 2,2l0,12a2,2 0 0 1 -2,2l-16,0a2,2 0 0 1 -2,-2l0,-12a2,2 0 0 1 2,-2m8,3a5,5 0 0 0 -5,5a5,5 0 0 0 5,5a5,5 0 0 0 5,-5a5,5 0 0 0 -5,-5m0,2a3,3 0 0 1 3,3a3,3 0 0 1 -3,3a3,3 0 0 1 -3,-3a3,3 0 0 1 3,-3z"></path>
                     </svg>`,
    "videographer": `<svg class="card-icon" viewBox="0 0 18 12" preserveAspectRatio="xMinYMid meet">
                       <path fill="#FFFFFF" d="m14,4.5l0,-3.5a1,1 0 0 0 -1,-1l-12,0a1,1 0 0 0 -1,1l0,10a1,1 0 0 0 1,1l12,0a1,1 0 0 0 1,-1l0,-3.5l4,4l0,-11l-4,4z"></path>
                     </svg>`,
    "caterer": `<svg class="card-icon" viewBox="0 0 22 22">
                  <path fill="#FFFFFF" d="m20,20l0,-4c0,-1.11 -0.9,-2 -2,-2l-1,0l0,-3c0,-1.11 -0.9,-2 -2,-2l-3,0l0,-2l-2,0l0,2l-3,0c-1.11,0 -2,0.89 -2,2l0,3l-1,0c-1.11,0 -2,0.89 -2,2l0,4l-2,0l0,2l22,0l0,-2m-11,-14a2,2 0 0 0 2,-2c0,-0.38 -0.1,-0.73 -0.29,-1.03l-1.71,-2.97l-1.72,2.97c-0.18,0.3 -0.28,0.65 -0.28,1.03a2,2 0 0 0 2,2z"></path>
                </svg>`,
    "music": `<svg class="card-icon" viewBox="0 0 19 18" preserveAspectRatio="xMinYMid meet">
                <path fill="#FFFFFF" d="m19,0l0,12.5a3.5,3.5 0 0 1 -3.5,3.5a3.5,3.5 0 0 1 -3.5,-3.5a3.5,3.5 0 0 1 3.5,-3.5c0.54,0 1.05,0.12 1.5,0.34l0,-5.87l-10,2.13l0,8.9a3.5,3.5 0 0 1 -3.5,3.5a3.5,3.5 0 0 1 -3.5,-3.5a3.5,3.5 0 0 1 3.5,-3.5c0.54,0 1.05,0.12 1.5,0.34l0,-8.34l14,-3z"></path>
              </svg>`,
    "cosmetics": `<svg class="card-icon" viewBox="0 0 364 433" preserveAspectRatio="xMinYMid meet">
                    <g>
                      <path fill="#FFFFFF" d="m284.888,117.03c-43.62,0 -79.106,35.487 -79.106,79.106l0,216.397c0,11.028 8.972,20 20,20l118.213,0c11.028,0 20,-8.972 20,-20l0,-216.396c0,-43.62 -35.487,-79.107 -79.107,-79.107z"></path>
                      <path fill="#FFFFFF" d="m155.888,293.783l-4.621,-127.843c-0.493,-13.627 -10.22,-25.117 -22.937,-28.461l0.079,-59.77c0.013,-9.725 -5.824,-22.225 -13.289,-28.459l-54.237,-45.287c-3.15,-2.63 -6.307,-3.963 -9.385,-3.963c-3.246,0 -6.166,1.575 -8.011,4.32c-1.536,2.285 -2.313,5.27 -2.309,8.871l0.116,124.28c-12.733,3.334 -22.474,14.832 -22.968,28.47l-4.621,127.843c-7.95,2.646 -13.705,10.142 -13.705,18.969l0,99.781c0,11.028 8.972,20 20,20l129.594,0c11.028,0 20,-8.972 20,-20l0,-99.781c-0.001,-8.827 -5.756,-16.324 -13.706,-18.97zm-117.922,-1.03l4.026,-111.364c0.248,-6.855 6.063,-12.464 12.923,-12.464l59.764,0c6.86,0 12.675,5.609 12.923,12.464l4.026,111.364l-93.662,0"></path>
                    </g>
                  </svg>`,
    "tailor": `<svg class="card-icon" viewBox="0 0 159.63 218.31" preserveAspectRatio="xMinYMin meet">
                 <path fill="#FFFFFF" d="m147.2832,126.225c-13.701,-34.254 -36.034,-54.336 -45.563,-61.749l2.815,-10.558c2.356,-2.014 6.079,-5.628 9.272,-10.646c5.866,-9.217 3.786,-16.223 3.309,-17.535c-0.587,-1.617 -1.714,-2.983 -3.19,-3.869c-0.222,-0.133 -0.686,-0.398 -1.361,-0.721l0,-13.647c0,-4.143 -3.358,-7.5 -7.5,-7.5c-4.142,0 -7.5,3.357 -7.5,7.5l0,11.501c-2.746,0.439 -5.407,1.328 -7.945,2.681c-4.035,2.152 -7.288,4.871 -9.806,7.484c-2.518,-2.613 -5.77,-5.332 -9.805,-7.483c-2.538,-1.354 -5.198,-2.243 -7.944,-2.682l0,-11.501c0,-4.143 -3.358,-7.5 -7.5,-7.5c-4.142,0 -7.5,3.357 -7.5,7.5l0,13.646c-0.677,0.324 -1.141,0.589 -1.363,0.723c-1.475,0.885 -2.601,2.251 -3.189,3.868c-0.476,1.311 -2.556,8.318 3.309,17.535c3.193,5.018 6.916,8.632 9.272,10.646l2.815,10.558c-9.529,7.413 -31.862,27.495 -45.563,61.749c-17.274,43.183 -11.458,83.978 -11.202,85.694c0.548,3.674 3.704,6.393 7.418,6.393l142.506,0c3.714,0 6.869,-2.719 7.417,-6.393c0.256,-1.715 6.071,-42.51 -11.202,-85.694z"></path>
               </svg>`
  };

  while (CURRENT_VENDORS_TOTAL < stoppingPoint && arr[CURRENT_VENDORS_TOTAL] !== undefined) {
    let $vendorCardWrapper = $("<li />", {"class": "vendor-list-card"});
    let value = arr[CURRENT_VENDORS_TOTAL];
    const $level = $(
      `<nav class="level is-mobile box">
        <div class="level-item has-text-centered">
          <div>
            <p class="heading">Rate</p>
            <p class="title is-6 has-text-weight-light">$${value.price}/hr</p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div>
            <p class="heading">Following</p>
            <p class="title is-6 has-text-weight-light">123</p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div>
            <p class="heading">Followers</p>
            <p class="title is-6 has-text-weight-light">456K</p>
          </div>
        </div>
      </nav>`
    );

    // let $card = $("<article />", {"class": "tile is-child card card-" + value.vendorType}).attr("data-vendor-id", value.id);

    const $card = $(`<article class="tile is-child card card-${value.vendorType}" data-vendor-id=${value.id}></article>`);

    const $cardHeader = $(
      `<div class="tile-header card-header-${value.vendorType}">
        <div class="icon card-icon-container">
          ${icons[value.vendorType]}
        </div>
        <div class="book-button shortcut tooltip" data-tooltip="Book">
          <div class="icon has-text-white book-icon">
            <i class="mdi mdi-plus-circle"></i>
          </div>
        </div>
        <div class="dropdown is-right card-dropdown tooltip" data-tooltip="More actions">
          <div class="dropdown-trigger">
            <a class="card-header-icon" aria-controls="dropdown-menu">
              <span class="icon">
                <i class="mdi mdi-24px mdi-chevron-down" aria-hidden="true"></i>
              </span>
            </a>
          </div>
          <div id="extra-actions" class="dropdown-menu" role="menu">
            <div class="dropdown-content">
              <a class="dropdown-item book-button">
                <span class="icon">
                  <i class="mdi mdi-plus-circle"></i>
                </span> Book
              </a>
              <a class="dropdown-item" href="/portfolio">
                <span class="icon">
                  <i class="mdi mdi-treasure-chest"></i>
                </span> Portfolio
              </a>
            </div>
          </div>
        </div>
      </div>`
    );

    const $overlay = $('<div class="overlay"></div>');

    $card.append($cardHeader, $overlay);

    const $ratingStars = generateRatingStars(value.rating);

    const $cardContent = $(
      `<div class="card-content">
        <div class="header"></div>
        <div class="media">
          <div class="media-left">
            <div class="image is-64x64 profile-picture-container"></div>
          </div>
          <div class="media-content">
            <div class="profile-info-container">
              <p class="title is-4 vendor-name has-text-weight-light">
                ${value.contactName}
              </p>
              <div class="vendor-location">
                ${value.city}, ${value.state}
              </div>
              ${$ratingStars}
            </div>
          </div>
        </div>
      </div>`
    );

    const $vendorBlurb = $(
      `<div class="content">
        <p class="vendor-blurb">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <a class="is-size-7" href="/portfolio">
          More...
        </a>
      </div>`
    );

    $cardContent.append($level, $vendorBlurb);
    $card.append($cardContent);
     
    $vendorCardWrapper.append($card);
    $wrapper.append($vendorCardWrapper);

    CURRENT_VENDORS_TOTAL++;
    console.log(CURRENT_VENDORS_TOTAL);
  }
  
  $wrapper.fadeIn(325);
  updateBookingNotifiers(BOOKED_VENDORS);

  console.log("Current Total:", CURRENT_VENDORS_TOTAL, "Stopping Point:", stoppingPoint, "Array Length:", arr.length);
}

function generateRatingStars(rating) {
  let container = `<div class="rating-container" title="${rating} out of 5">`;
  let starClass;

  for (let i = 0; i < 5; i++) {
    starClass = i < rating ? "filled-star" : "empty-star";

    container += `<span class="icon is-small"><i class="mdi mdi-star ${starClass}"></i></span>`;
  }

  container += "</div>";

  return container;
}

// Functions for booking vendors

function addBookingListeners() {
  $(document).on('click', '.book-button', e => {
    if (window.sessionDetails.session == false) {
      alert("You must be logged in to book a vendor.");
    } else {
      $('#bookingModal').fadeIn(125);
      VENDOR_ID = $(e.currentTarget).parent().parent().attr('data-vendor-id');
      $('#bookRequestName').val($(e.currentTarget).parent().siblings('.card-content').find('.vendorName').text());
      $('#bookRequestBusiness').val($(e.currentTarget).parent().siblings('.card-content').find('.businessName').text());
      // Adding DatePicker each time a booking modal is active
      var datePicker = new DatePicker(document.getElementById('bookRequestDate'), {dataFormat: "yyyy-mm-dd"});
    }
  });
}

function addCloseModalListeners() {
  $(document).on('click', '#modalCloseButton, #modalCloseLayer, #cancelButton', e => {
    $('#bookingModal').fadeOut(125, () => {
      resetModalView();
    });
    $('.datepicker').remove();
    $('#bookRequestDate').val("");
  });
}

function addBookFulfillmentListener() {
  $('#bookVendor').on('click', e => {
    let vendorID = VENDOR_ID;
    let date = $('#bookRequestDate').val();
    postBookRequest(vendorID, date);
  });
}

function postBookRequest(id, date) {
  // Show AJAX booking animation

  $('.modal-card-body .overlay').fadeTo("fast", 0.75);
  $('#bookVendor').addClass('is-loading');

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
    
    // Hide AJAX booking animation

    $('.modal-card-body .overlay').fadeOut("fast");
    $('#bookVendor').removeClass('is-loading');
  })
  .fail((xhr) => {
    displayErrorMessage(xhr.responseJSON.message);

    // Hide AJAX booking animation

    $('.modal-card-body .overlay').fadeOut("fast");
    $('#bookVendor').removeClass('is-loading');
  });
}

function displayBookingConfirmation(json, id) {
  const info = json.bookingInfo;

  $('.bookingInputBox, #bookingFooter').hide();

  $('#bookingInfoBox').append($('<p class="subtitle detail">').text(info.book_date));
  $('#vendorBusinessBox').append($('<p class="subtitle detail">').text(info.vendor_business));
  $('#vendorNameBox').append($('<p class="subtitle detail">').text(info.vendor_name));

  $('.confirmationMessage, #confirmFooter').show();
  BOOKED_VENDORS.push(id);
  updateBookingNotifiers(BOOKED_VENDORS);
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