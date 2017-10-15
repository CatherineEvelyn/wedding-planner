var api_call_made = false;
$(function () {
  addSignupListener();
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
    url: '/vendor?type=' + type
  })
  .done(json => {
    console.log(json);
    api_call_made = false;
  })
}
