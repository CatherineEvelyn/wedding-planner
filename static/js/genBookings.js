let bookings = {}

$(function() {
  retrieveDates();
  addRerenderCalendarListeners();
  addBookingDetailsListeners();
});

function retrieveDates() {
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
  })
  .fail(err => {
    console.log(err);
  });
}

function addBookingsToCalendar(json) {
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
    $('#bookingDateBox').append(
      $('<p />', {"class": "subtitle detail"}).text(
        $(e.currentTarget).attr(
          'data-booking-date')
        )
      );
    $('#startTimeBox').append(
      $('<p />', {"class": "subtitle detail"}).text(
        $(e.currentTarget).attr(
          'data-start-time')
        )
      );
    $('#endTimeBox').append(
      $('<p />', {"class": "subtitle detail"}).text(
        $(e.currentTarget).attr(
          'data-end-time')
        )
      );
    $('.modal').addClass('is-active');
  })
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

function tConvert(time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'am' : 'pm'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
    adjustedTime = [time[0], time[1], time[2], time[5]];
  }
  return adjustedTime.join(''); // return adjusted time or original string
}

function addCloseModalListeners() {
  $('.closeModal').on('click', e => {
    $('.modal').removeClass('is-active');
    $('.detail').remove();
  })
}
