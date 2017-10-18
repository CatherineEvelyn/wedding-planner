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
    url: '/vendor?type=' + type
  })
  .done(json => {
    appendVendors(json);
    console.log(json);
    api_call_made = false;
  })
}
function makeCard(vendor){
  let card = $('<div class="card">');
  let card_content = $('<div class="card-content">');

  let title = $('<p class="title">').text(vendor.businessName);
  let email = $('<p>').text(vendor.email);

  card_content.append(title, makeParagraph(vendor.email), makeParagraph(vendor.streetAddress), makeParagraph(vendor.city));
  card.append(card_content);
  return card;
}

function makeParagraph(text){
  return $('<p>').text(text);
}
function appendVendors(obj){
  let container = $('.vendors');
  container.empty();
  for(let index in obj.vendors){
    let vendor = obj.vendors[index];
    container.append(makeCard(vendor));
  }
}
