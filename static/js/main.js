var api_call_made = false;
$(function () {
  addSignupListener();
  addBlur();
  addAjaxListeners();
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
    url: '/vendor?type=' + type
  })
  .done(json => {
    console.log(json);
    api_call_made = false;
  })
}
