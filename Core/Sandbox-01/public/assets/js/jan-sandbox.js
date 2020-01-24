$(window).load(function() {
  $('.post-module').click(function() {
    $(this).find('.description').stop().animate({
      height: "toggle",
      opacity: "toggle"
    }, 300);
  });
});