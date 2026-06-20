/* ============================================================
   AquaSense – main.js
   Handles: Loading, Navbar, Scroll animations, Counters,
            Particles, Back-to-top, Hero mini-dashboard
   ============================================================ */
$(document).ready(function () {

  /* ----------------------------------------------------------
     LOADING SCREEN
  ---------------------------------------------------------- */
  setTimeout(function () {
    $('#loading-screen').addClass('hidden');
    setTimeout(function () {
      $('#loading-screen').remove();
    }, 700);
  }, 2200);

  /* ----------------------------------------------------------
     NAVBAR SCROLL EFFECT
  ---------------------------------------------------------- */
  function handleNavbarScroll() {
    var scrollTop = $(window).scrollTop();
    if (scrollTop > 60) {
      $('.navbar').addClass('scrolled');
      $('#backToTop').addClass('visible');
    } else {
      $('.navbar').removeClass('scrolled');
      $('#backToTop').removeClass('visible');
    }
  }
  $(window).on('scroll', handleNavbarScroll);
  handleNavbarScroll();

  /* ----------------------------------------------------------
     ACTIVE NAV LINK
  ---------------------------------------------------------- */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $('.navbar-nav .nav-link').each(function () {
    var href = $(this).attr('href');
    if (href === currentPage) $(this).addClass('active');
  });

  /* ----------------------------------------------------------
     BACK TO TOP
  ---------------------------------------------------------- */
  $('#backToTop').on('click', function () {
    $('html, body').animate({ scrollTop: 0 }, 600, 'swing');
  });

  /* ----------------------------------------------------------
     SMOOTH SCROLLING FOR ANCHOR LINKS
  ---------------------------------------------------------- */
  $('a[href^="#"]').on('click', function (e) {
    var target = $(this.hash);
    if (target.length) {
      e.preventDefault();
      var offset = parseInt($('.navbar').outerHeight()) + 20;
      $('html, body').animate({ scrollTop: target.offset().top - offset }, 700);
    }
  });

  /* ----------------------------------------------------------
     SCROLL REVEAL ANIMATIONS
  ---------------------------------------------------------- */
  function revealOnScroll() {
    var windowBottom = $(window).scrollTop() + $(window).height() - 80;
    $('.reveal, .reveal-left, .reveal-right').each(function () {
      if ($(this).offset().top < windowBottom) {
        $(this).addClass('revealed');
      }
    });
  }
  $(window).on('scroll', revealOnScroll);
  revealOnScroll(); // run on page load

  /* ----------------------------------------------------------
     ANIMATED COUNTERS
  ---------------------------------------------------------- */
  var countersStarted = false;
  function startCounters() {
    if (countersStarted) return;
    var statsSection = $('#stats');
    if (!statsSection.length) return;
    var statsTop = statsSection.offset().top;
    var windowBottom = $(window).scrollTop() + $(window).height();
    if (windowBottom > statsTop + 100) {
      countersStarted = true;
      $('.stat-number[data-target]').each(function () {
        var $el = $(this);
        var target = parseInt($el.data('target'));
        var suffix = $el.data('suffix') || '';
        var duration = 2000;
        var stepTime = Math.max(Math.floor(duration / target), 15);
        var current = 0;
        var timer = setInterval(function () {
          current += Math.ceil(target / (duration / stepTime));
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          $el.text(current + suffix);
        }, stepTime);
      });
    }
  }
  $(window).on('scroll', startCounters);
  startCounters();



  /* ----------------------------------------------------------
     AOS INITIALIZATION
  ---------------------------------------------------------- */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-quad'
    });
  }

  /* ----------------------------------------------------------
     FLOATING BUBBLES GENERATOR
  ---------------------------------------------------------- */
  function createBubbles() {
    $('.bubble-container').each(function () {
      var $container = $(this);
      var count = $container.data('bubble-count') || 20;
      for (var i = 0; i < count; i++) {
        var size = Math.random() * 16 + 6;
        var left = Math.random() * 100;
        var delay = Math.random() * 6;
        var duration = Math.random() * 6 + 5;
        var bubble = $('<div class="bubble-item">').css({
          width: size + 'px',
          height: size + 'px',
          left: left + '%',
          animationDelay: delay + 's',
          animationDuration: duration + 's'
        });
        $container.append(bubble);
      }
    });
  }
  createBubbles();

  /* ----------------------------------------------------------
     HERO MINI-DASHBOARD GAUGE ANIMATIONS
  ---------------------------------------------------------- */
  function updateGauge(fillId, valId, value, maxVal, suffix) {
    var circle = document.getElementById(fillId);
    var $text = $('#' + valId);
    if ($text.length) $text.text(value + suffix);
    if (!circle) return;
    var radius = circle.r.baseVal.value;
    var circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = circumference + ' ' + circumference;
    var pct = Math.min(Math.max(value / maxVal, 0), 1);
    var offset = circumference - pct * circumference;
    circle.style.strokeDashoffset = offset;
  }

  function updateMiniDashboard() {
    var data = {
      level:  Math.floor(Math.random() * 10 + 72),
      flow:   Math.floor(Math.random() * 4 + 10),
      tds:    Math.floor(Math.random() * 40 + 220),
      turb:   parseFloat((Math.random() * 1.5 + 3.2).toFixed(1)),
      temp:   Math.floor(Math.random() * 2 + 25)
    };

    updateGauge('gauge-fill-level', 'mini-level-val', data.level, 100, '%');
    updateGauge('gauge-fill-flow',  'mini-flow-val',  data.flow,  30,  ' L/m');
    updateGauge('gauge-fill-tds',   'mini-tds-val',   data.tds,   500, ' ppm');
    updateGauge('gauge-fill-turb',  'mini-turb-val',  data.turb,  10,  ' NTU');
    updateGauge('gauge-fill-temp',  'mini-temp-val',  data.temp,  50,  '°C');
  }

  if ($('#mini-level-val').length || $('#gauge-fill-level').length) {
    updateMiniDashboard();
    setInterval(updateMiniDashboard, 4000);
  }

  /* ----------------------------------------------------------
     FEATURE CARDS STAGGER ANIMATION
  ---------------------------------------------------------- */
  $('.feature-card').each(function (i) {
    $(this).css('transition-delay', (i * 0.05) + 's');
  });

  /* ----------------------------------------------------------
     NAVBAR COLLAPSE CLOSE ON LINK CLICK (MOBILE)
  ---------------------------------------------------------- */
  $('.navbar-nav .nav-link').on('click', function () {
    var navCollapse = $('.navbar-collapse');
    if (navCollapse.hasClass('show')) {
      navCollapse.collapse('hide');
    }
  });

  /* ----------------------------------------------------------
     TOOLTIP INIT (Bootstrap)
  ---------------------------------------------------------- */
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach(function (el) {
    new bootstrap.Tooltip(el);
  });

});
