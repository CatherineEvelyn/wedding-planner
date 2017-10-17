var api_call_made = false;
$(function () {
  addSignupListener();
  addBlur();
  addAjaxListeners();
});

function addSignupListener() {
  $('.toggle-form').click(e => {
    let $self = $(e.currentTarget);

    $('.toggle-form').removeClass('active-form');
    $self.addClass('active-form');

    if ($self.hasClass('show-vendor')) {
      $('.vendor-signup').show();
      $('.organizer-signup').hide();
    } else {
      $('.vendor-signup').hide();
      $('.organizer-signup').show();
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
    url: '/getvendors?type=' + type
  })
  .done(json => {
    console.log(json);
    api_call_made = false;
  })
}

function displayVendors(json) {
  const $vendorCardWrapper = $('<div />', {"class": "tile is-parent vendor-list-card"}).append(
    $("<article />", {"class": "tile is-child notification is-info"}).append(
      $("<p />", {"class": "title"}),
      $("<p />", {"class": "subtitle"}),
      $("<p />"),
      $("<p />").append(
        $("<small />")
      ),
      $("<p />").append(
        $("<small />")
      )
    )
  );
}
