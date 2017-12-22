import { BookingViewer } from './BookingViewer.js';

var bookings = {};
var bookingViewer = new BookingViewer(
  document.getElementById('bookingViewer'), {
    dataFormat: "yyyy-mm-dd",
    closeOnSelect: false
  }
);

$(function() {
  addAjaxListeners();
  addRerenderCalendarListeners();
  addBookingDetailsListeners();
  addSaveChangesListener();

  var loc, tag;

  update_tag();

  $(window).on('popstate', e => {
    update_tag();
  });

  function update_tag() {
    loc = window.location.href.split('#');
    tag = loc.length > 1 ? loc[1] : '';
    if (tag === "bookings") {
      retrieveDates();
    } else if (tag === "account") {
      showAccountInfo();
    } else if (!tag) {
      retrieveDates();
    }
  }
});

function addAjaxListeners() {
  $('.getBookings').on('click', e=> {
    retrieveDates();
  });
  $('.getAccount').on('click', e=> {
    showAccountInfo();
  });
}

function retrieveDates() {
  $(document).unbind("ajaxStart.bookingsCall");
  $(document).unbind("ajaxStop.bookingsCall");
  // Adding loading indicators for loading bookings call
  $(document).bind("ajaxStart.bookingsCall", () => {
    $('.overlay').show();
  });
  $(document).bind("ajaxStop.bookingsCall", () => {
    $('.overlay').hide();
    console.log("ajax stopped");
  });

  $('#accountView').hide();
  $('#bookingsView').show();

  $('.navbar-item.is-tab').removeClass('is-active');  
  $('.getBookings').addClass('is-active');

  $.ajax({
    method: "GET",
    url: "/profile",
    data: {
      source: "ajax"
    }
  })
  .done(json => {
    bookings = json;
    addBookingsToCalendar(json);
    console.log('booking call complete!');
  })
  .fail(err => {
    console.log(err);
  });
}

function showAccountInfo() {
  $('#bookingsView').hide();
  $('#accountView').show();

  $('.navbar-item.is-tab').removeClass('is-active');  
  $('.getAccount').addClass('is-active');
}

function addBookingsToCalendar(json) {
  // Empty out date boxes from previous calls
  $('.calendar-events').remove();

  $.each(json, (index, value) => {
    let $dayItem = $('#' + value.bookedDate);
    if ($dayItem.children('.calendar-events').length) {
      $dayItem.children('.calendar-events').append(
        $('<a />', {"class": "calendar-event is-primary tooltip"})
          .text(value.userName)
          .attr("data-tooltip", tConvert(value.eventStartTime) + " - " + tConvert(value.eventEndTime))
          .attr("data-user-name", value.userName)
          .attr("data-user-email", value.userEmail)
          .attr("data-booking-date", formatDate(value.bookedDate))
          .attr("data-start-time", value.eventStartTime)
          .attr("data-end-time", value.eventEndTime)
      );
    } else {
      $('#' + value.bookedDate).append(
        $('<div />', {"class": "calendar-events"}).append(
          $('<a />', {"class": "calendar-event is-primary tooltip"})
            .text(value.userName)
            .attr("data-tooltip", tConvert(value.eventStartTime) + " - " + tConvert(value.eventEndTime))
            .attr("data-user-name", value.userName)
            .attr("data-user-email", value.userEmail)
            .attr("data-booking-date", formatDate(value.bookedDate))
            .attr("data-start-time", value.eventStartTime)
            .attr("data-end-time", value.eventEndTime)
        )
      );
    }
  });
}

function addRerenderCalendarListeners() {
  $(document).on('click', '#prevYear, #prevMonth, #nextMonth, #nextYear', e => {
    console.log(bookings);
    addBookingsToCalendar(bookings);
  });
}

function addBookingDetailsListeners() {
  $(document).on('click', '.calendar-event', e => {
    let $self = $(e.currentTarget);
    let $detail = $('<p />', {"class": "subtitle detail"});
    $('.modal').addClass('is-active');
    $('#bookingDateBox').append(
      $detail.clone().text($self.attr('data-booking-date'))
    );
    $('#startTimeBox').append(
      $detail.clone().text(tConvert($self.attr('data-start-time')))
    );
    $('#endTimeBox').append(
      $detail.clone().text(tConvert($self.attr('data-end-time')))
    );
  });
}

function addSaveChangesListener() {
  $('#saveButton').on('click', e => {
    e.preventDefault();

    let name = $('#contactName').val();
    let bus = $('#businessName').val();
    let add = $('#streetAddress').val();
    let city = $('#city').val();
    let state = $('#state').val();
    let zip = $('#zipcode').val();

    editAccountDetails(name, bus, add, city, state, zip);
  })
}

function editAccountDetails(name, bus, addr, city, state, zip) {
  $(document).unbind("ajaxStart.bookingsCall");
  $(document).unbind("ajaxStop.bookingsCall");
  // Adding loading indicators for loading bookings call
  $(document).bind("ajaxStart.saveCall", () => {
    $('#saveButton').addClass('is-loading');
  });
  $(document).bind("ajaxStop.saveCall", () => {
    $('#saveButton').removeClass('is-loading');
    console.log("ajax stopped");
  });

  $.ajax({
    method: "POST",
    url: "/profile",
    data: {
      name: name,
      businessName: bus,
      streetAddress: addr,
      city: city,
      state: state,
      zipcode: zip
    }
  })
  .done(() => {
    $('.save-container').append(
      $('<span />', {"class": "icon has-text-success"}).append(
        $('<i />', {"class": "mdi mdi-check-circle"})
      )
    )
    .append(
      $('<span />', {"class": "is-5 has-text-success"})
      .text("Changes saved!")
    )
  })
  .fail(() => {
    console.log("Something went wrong.")
  });
}

function formatDate(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var time = Date.parse(date);
  var newdate = new Date(time);

  var day = newdate.getUTCDate();
  var monthIndex = newdate.getUTCMonth();
  var year = newdate.getUTCFullYear();

  return monthNames[monthIndex] + " " + day + ", " + year;
}

function tConvert (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
  let adjustedTime;

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'am' : 'pm'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
    adjustedTime = [time[0], time[1], time[2], time[5]];
  }
  return adjustedTime.join (''); // return adjusted time or original string
}

function addCloseModalListeners() {
  $('.closeModal').on('click', e => {
    $('.modal').removeClass('is-active');
    $('.detail').remove();
  });
}
