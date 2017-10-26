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
          .attr("data-tooltip", value.eventStartTime)
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
            .attr("data-tooltip", value.eventStartTime)
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
