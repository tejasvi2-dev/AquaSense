/* ============================================================
   AquaSense – contact.js
   Handles: jQuery form validation, form submission feedback
   ============================================================ */
$(document).ready(function () {

  /* ----------------------------------------------------------
     FORM VALIDATION HELPERS
  ---------------------------------------------------------- */
  function showError(fieldId, msgId) {
    $('#' + fieldId).addClass('field-error');
    $('#' + msgId).addClass('show');
  }
  function clearError(fieldId, msgId) {
    $('#' + fieldId).removeClass('field-error');
    $('#' + msgId).removeClass('show');
  }
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function isValidPhone(phone) {
    return /^[\+]?[0-9\s\-\(\)]{8,15}$/.test(phone.trim());
  }

  /* ----------------------------------------------------------
     LIVE VALIDATION ON INPUT
  ---------------------------------------------------------- */
  $('#contact-name').on('input', function () {
    var val = $(this).val().trim();
    if (val.length >= 3) { clearError('contact-name', 'err-name'); $('#icon-name').addClass('show'); }
    else { showError('contact-name', 'err-name'); $('#icon-name').removeClass('show'); }
  });
  $('#contact-email').on('input', function () {
    var val = $(this).val().trim();
    if (isValidEmail(val)) { clearError('contact-email', 'err-email'); $('#icon-email').addClass('show'); }
    else { showError('contact-email', 'err-email'); $('#icon-email').removeClass('show'); }
  });
  $('#contact-phone').on('input', function () {
    var val = $(this).val().trim();
    if (val === '' || isValidPhone(val)) { clearError('contact-phone', 'err-phone'); if (val) $('#icon-phone').addClass('show'); else $('#icon-phone').removeClass('show'); }
    else { showError('contact-phone', 'err-phone'); $('#icon-phone').removeClass('show'); }
  });
  $('#contact-message').on('input', function () {
    var val = $(this).val().trim();
    if (val.length >= 20) { clearError('contact-message', 'err-message'); $('#icon-message').addClass('show'); }
    else { showError('contact-message', 'err-message'); $('#icon-message').removeClass('show'); }
  });

  /* ----------------------------------------------------------
     FORM SUBMISSION
  ---------------------------------------------------------- */
  $('#contact-form').on('submit', function (e) {
    e.preventDefault();
    var valid = true;

    var name    = $('#contact-name').val().trim();
    var email   = $('#contact-email').val().trim();
    var phone   = $('#contact-phone').val().trim();
    var message = $('#contact-message').val().trim();

    if (name.length < 3) { showError('contact-name', 'err-name'); valid = false; }
    else clearError('contact-name', 'err-name');

    if (!isValidEmail(email)) { showError('contact-email', 'err-email'); valid = false; }
    else clearError('contact-email', 'err-email');

    if (phone && !isValidPhone(phone)) { showError('contact-phone', 'err-phone'); valid = false; }
    else clearError('contact-phone', 'err-phone');

    if (message.length < 20) { showError('contact-message', 'err-message'); valid = false; }
    else clearError('contact-message', 'err-message');

    if (!valid) {
      // Shake the form
      $('#contact-form').addClass('shake');
      setTimeout(function () { $('#contact-form').removeClass('shake'); }, 600);
      return;
    }

    // Simulate submission
    var $btn = $('#btn-submit');
    $btn.prop('disabled', true).html('<i class="bi bi-hourglass-split me-2"></i>Sending...');

    setTimeout(function () {
      $btn.html('<i class="bi bi-check-circle me-2"></i>Sent Successfully!').addClass('btn-success-state');
      $('#form-success').slideDown(400);
      $('#contact-form')[0].reset();
      $('.field-error').removeClass('field-error');
      $('.error-msg').removeClass('show');
      $('.success-icon').removeClass('show');

      setTimeout(function () {
        $btn.prop('disabled', false).removeClass('btn-success-state').html('<i class="bi bi-send me-2"></i>Send Message');
        $('#form-success').slideUp(400);
      }, 5000);
    }, 1800);
  });

  /* ----------------------------------------------------------
     CHAR COUNTER FOR MESSAGE FIELD
  ---------------------------------------------------------- */
  $('#contact-message').on('input', function () {
    var len = $(this).val().length;
    $('#msg-counter').text(len + ' / 500');
    if (len > 450) $('#msg-counter').css('color', '#ffc107');
    else $('#msg-counter').css('color', '');
  });

});
