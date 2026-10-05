(function ($, Drupal) {
  $(document).ready(function () {
    // Disabling Pay.gov form payment amount increse/decrease arrow
    $('input[type=number]').on('keydown', function (event) {
      if (event.keyCode === 38 || event.keyCode === 40) {
        event.preventDefault();
      }
    });

    // Show "back to top" button on scroll.
    $(window).scroll(function () {
      $('.usa-footer__return-to-top').show();
    });

    // Scroll behavior for "back to top" button.
    $('.usa-footer__return-to-top a').click(function (e) {
      $('html, body').animate({scrollTop: 0}, 'slow', function () {
        $('.usa-footer__return-to-top').hide();
      });
      return false;
    });

    // Hiding alerts if sessionStorage is set.
    if (sessionStorage.getItem('Site Alert IDs')) {
      const locValues = JSON.parse(sessionStorage.getItem('Site Alert IDs'));
      const locDiff = Math.floor((Date.now() - locValues.Time) / 1000);
      if (locDiff > 86400) {
        // Check if session is longer than 24 hours and clear sessionStorage and show
        sessionStorage.removeItem('Site Alert IDs');
        $('.usa-alert').each(function () {
          $(this).removeAttr('hidden');
        });
      }
      else {
        $('.usa-alert').each(function () {
          const alertId = $(this).attr('id');
          if (
            locValues.length !== 0 &&
            $.inArray(alertId, locValues.Ids) === -1
          ) {
            $(`#${alertId}`).removeAttr('hidden');
          }
          $(`#close-${alertId}`).click(function (e) {
            locValues.Ids.push(alertId);
            $(`#${alertId}`).attr('hidden', '');
            sessionStorage.setItem('Site Alert IDs', JSON.stringify(locValues));
          });
        });
      }
    }
    // Showing alerts if sessionStorage is not set
    else {
      const siteAlert = {};
      siteAlert.Ids = [];
      $('.usa-alert').each(function () {
        $(this).removeAttr('hidden');
        const alertId = $(this).attr('id');
        $(`#close-${alertId}`).click(function (e) {
          siteAlert.Time = Date.now(); // Recording time for first alert closed
          siteAlert.Ids.push(alertId); // Storing id to my obj
          $(`#${alertId}`).attr('hidden', ''); // Hiding it
          sessionStorage.setItem('Site Alert IDs', JSON.stringify(siteAlert));
        });
      });
    }

    // DataLayer Events: Online Payments for Federal Tickets
    if ($('#cvb-payform-payform').length > 0) {
      // Cancel button is clicked
      $('#cvb-payform-payform [id=edit-cancel]').click(function () {
        window.dataLayer.push({
          event: 'payment_cancel',
          payment_status: 'cancellation'
        });
      });

      // Entered info and Next button is clicked
      // if ($("#cvb-payform-payform [id=edit-suffix]").is(":visible")) {
      if (!$('#cvb-payform-payform [class=cvb-ticket-warning]').length) {
        if ($('#cvb-payform-payform p').attr('id') === 'prior_payment') {
          window.dataLayer.push({
            event: 'payment_ticket_lookup',
            found_status: 'prior_payment'
          });
        }
        else if ($('#cvb-payform-payform p').attr('id') === 'mandatory_court_appearance') {
          window.dataLayer.push({
            event: 'payment_ticket_lookup',
            found_status: 'mandatory_court_appearance'
          });
        }
        else if ($('#cvb-payform-payform p').attr('id') === 'found') {
          window.dataLayer.push({
            event: 'payment_ticket_lookup',
            found_status: 'found'
          });
        }
      }
      else {
        if ($('#cvb-payform-payform p').attr('id') === 'federal_debt') {
          window.dataLayer.push({
            event: 'payment_ticket_lookup',
            found_status: 'federal_debt'
          });
        }
        else if ($('#cvb-payform-payform p').attr('id') === 'payment_dispute') {
          window.dataLayer.push({
            event: 'payment_ticket_lookup',
            found_status: 'payment_dispute'
          });
        }
        else if ($('#cvb-payform-payform p').attr('id') === 'name_mismatch') {
          window.dataLayer.push({
            event: 'payment_ticket_lookup',
            found_status: 'name_mismatch'
          });
        }
        else if ($('#cvb-payform-payform p').attr('id') === 'not_found') {
          window.dataLayer.push({
            event: 'payment_ticket_lookup',
            found_status: 'not_found'
          });
        }
      }

      // Continuing to Pay.gov
      $('#cvb-payform-payform [id=edit-pay-gov]').click(function () {
        // Ticket not found message NOT showing
        if (!$('#cvb-payform-payform [class=cvb-ticket-warning]').length) {
          if ($('#cvb-payform-payform [id=edit-phone]').val()) {
            window.dataLayer.push({
              event: 'payment_continue_paygov',
              payment_status: 'continue_to_paygov'
            });
          }
          else {
            window.dataLayer.push({
              event: 'payment_continue_paygov_error',
              payment_status: 'form_error'
            });
          }
        }
        // Ticket not found message showing
        else {
          if (!$('#cvb-payform-payform [id=edit-amount]').val() ||
            !$('#cvb-payform-payform [id=edit-last-name]').val() ||
            !$('#cvb-payform-payform [id=edit-first-name]').val() ||
            !$('#cvb-payform-payform [id=edit-middle-initial]').val() ||
            !$('#cvb-payform-payform [id=edit-phone]').val()) {
            window.dataLayer.push({
              event: 'payment_continue_paygov_error',
              payment_status: 'form_error'
            });
          }
          else {
            window.dataLayer.push({
              event: 'payment_continue_paygov',
              payment_status: 'continue_to_paygov'
            });
          }
        }
      });
    }

    // Pay-gov transaction complete
    if ($('#block-cvb-content h1').attr('id') === 'transaction-complete') {
      window.dataLayer.push({
        event: 'payment_completed',
        payment_status: 'payment_success'
      });
    }
    // Pay-gov transaction failure
    else if ($('#block-cvb-content h1').attr('id') === 'transaction-failed') {
      window.dataLayer.push({
        event: 'payment_completed',
        payment_status: 'payment_failure'
      });
    }
    // Pay-gov transaction error
    else if ($('#block-cvb-content h1').attr('id') === 'transaction-error') {
      window.dataLayer.push({
        event: 'payment_completed',
        payment_status: 'payment_error'
      });
    }
    // Pay-gov transaction cancelled
    var uri_page = window.location.pathname;
    var stat_message = $('p#status-message').text().trim();
    if (uri_page === '/pay-ticket/online-payment-federal-tickets' &&
       stat_message === 'Your pay.gov transaction has been canceled.') {
      window.dataLayer.push({
        event: 'payment_cancel',
        payment_status: 'cancellation_on_paygov'
      });
    }

    // Printing Payment Confirmation
    $('#block-cvb-content [id=print-confirm]').click(function () {
      window.dataLayer.push({
        event: 'payment_confirmation_action',
        confirmation_action: 'print_confirmation'
      });
    });

    // Making Another Payment
    $('#block-cvb-content [id=another-payment]').click(function () {
      window.dataLayer.push({
        event: 'payment_confirmation_action',
        confirmation_action: 'new_payment'
      });
    });
  });
})(jQuery, Drupal);
