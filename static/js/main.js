$(function(){
  addSignupListener();
});

function addSignupListener(){
  $('.toggle-form').click(e => {
    let $self = $(e.currentTarget);
    console.log($self);

    $('.toggle-form').removeClass('active-form');
    $self.addClass('active-form');

    if($self.hasClass('show-vendor')){
      $('.vendor-signup').show();
      $('.organizer-signup').hide();
    }else{
      $('.vendor-signup').hide();
      $('.organizer-signup').show();
    }
  })
}
