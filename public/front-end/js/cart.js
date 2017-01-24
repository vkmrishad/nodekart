
$(document).ready(function() {

    $(document).on('click', "a", function(e) {

    var addId = $(this).attr('addId');
      if (addId) {$.post('/cart/add/' + addId, function(data) {
        $('.navbar-icons').html(data);

    });}

    });


});
