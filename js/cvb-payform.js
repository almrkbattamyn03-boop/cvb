(function ($) {

  $(document).ready(function () {
    $('#edit-loc-code').autocomplete({
      source: function (request, response) {
        // Convert user search term to upper case.
        const term = request.term.toUpperCase();

        // Fetch location data from Drupal settings.
        const locs = drupalSettings.data.cvb_locations;

        // Filter locations by search term.
        const results = locs.filter(obj => {
          return obj.startsWith(term);
        });

        // Limit to 10 results.
        results.splice(10);

        response(results);
      }
    });
  });
})(jQuery);
