$(function () {
  addSignupListener();
  addBlur();
});

function addSignupListener() {
  $('.toggle-form').click(e => {
    let $self = $(e.currentTarget);
    console.log($self);

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