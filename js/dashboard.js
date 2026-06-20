/* ============================================================
   AquaSense – dashboard.js
   Handles: ThingSpeak AJAX fetching, Chart.js rendering,
            Sensor card updates, Alert panel, Auto-refresh
   ============================================================ */

/* ============================================================
   THINGSPEAK CONFIG — Replace with your actual credentials
   ============================================================ */
var THINGSPEAK_CONFIG = {
  channelId: '3411404',
  apiKey: 'F67IDPLA9LJPQJGX',
  results: 20,
  baseUrl: 'https://api.thingspeak.com/channels/',
  refreshMs: 15000
};

/* ============================================================
   CHART INSTANCES
   ============================================================ */
var charts = {};

/* ============================================================
   SENSOR THRESHOLDS (for alerts)
   ============================================================ */
var THRESHOLDS = {
  level: { warn: 40, critical: 20 },
  flow:  { warn: 8,  critical: 12 },
  tds:   { low:  100, high: 500 },
  turb:  { warn: 5,  critical: 15 },
  temp:  { warn: 30, critical: 40 }
};

/* ============================================================
   DEMO / FALLBACK DATA GENERATOR
   Used when ThingSpeak channel is not yet configured
   ============================================================ */
function generateDemoData(count) {
  var feeds = [];
  var now = new Date();
  for (var i = count; i >= 0; i--) {
    var t = new Date(now.getTime() - i * 60000);
    feeds.push({
      created_at: t.toISOString(),
      field1: (Math.random() * 30 + 60).toFixed(1),   // Water Level %
      field2: (Math.random() * 4 + 10).toFixed(1),    // Flow Rate L/min
      field3: (Math.random() * 80 + 210).toFixed(0),  // TDS ppm
      field4: (Math.random() * 3 + 2).toFixed(1),     // Turbidity NTU
      field5: (Math.random() * 3 + 24).toFixed(1)     // Temperature °C
    });
  }
  return feeds;
}

/* ============================================================
   FETCH DATA FROM THINGSPEAK
   Falls back to demo data if channel ID is placeholder
   ============================================================ */
function fetchSensorData() {
  setRefreshIndicator(true);

  if (THINGSPEAK_CONFIG.channelId === 'YOUR_CHANNEL_ID') {
    // Demo mode
    var demoFeeds = generateDemoData(THINGSPEAK_CONFIG.results);
    processSensorData(demoFeeds);
    updateLastFetched();
    setRefreshIndicator(false);
    return;
  }

  var url = THINGSPEAK_CONFIG.baseUrl
    + THINGSPEAK_CONFIG.channelId
    + '/feeds.json?api_key='
    + THINGSPEAK_CONFIG.apiKey
    + '&results='
    + THINGSPEAK_CONFIG.results;

  $.ajax({
    url: url,
    method: 'GET',
    dataType: 'json',
    timeout: 10000,
    success: function (data) {
      if (data && data.feeds && data.feeds.length > 0) {
        processSensorData(data.feeds);
        updateLastFetched();
      } else {
        showDataError('No data received from ThingSpeak.');
      }
      setRefreshIndicator(false);
    },
    error: function (xhr, status, error) {
      console.warn('ThingSpeak fetch failed:', error);
      // Fallback to demo
      var demoFeeds = generateDemoData(THINGSPEAK_CONFIG.results);
      processSensorData(demoFeeds);
      updateLastFetched();
      setRefreshIndicator(false);
    }
  });
}

/* ============================================================
   PROCESS & DISPLAY SENSOR DATA
   ============================================================ */
function processSensorData(feeds) {

  var latest = feeds[feeds.length - 1];

  // ThingSpeak Mapping
  var level = parseFloat(latest.field1) || 0;
  var temp  = parseFloat(latest.field2) || 0;
  var turb  = parseFloat(latest.field3) || 0;
  var flow  = parseFloat(latest.field4) || 0;
  var tds   = parseFloat(latest.field5) || 0;

  // Update Cards
  animateValue('#card-level-val', level.toFixed(1) + '%');
  animateValue('#card-flow-val', flow.toFixed(1) + ' L/min');
  animateValue('#card-turb-val', turb.toFixed(1) + ' NTU');
  animateValue('#card-temp-val', temp.toFixed(1) + ' °C');

  // Only if TDS card exists
  if(document.querySelector('#card-tds-val')){
    animateValue('#card-tds-val', tds.toFixed(0) + ' ppm');
  }

  // Status Badges
  setLevelStatus(level);
  setFlowStatus(flow);
  setTurbStatus(turb);
  setTempStatus(temp);

  if(document.querySelector('#status-tds')){
    setTdsStatus(tds);
  }

  // Progress Bars
  animateProgress('#prog-level', level, 100);
  animateProgress('#prog-flow', flow, 30);
  animateProgress('#prog-turb', turb, 20);
  animateProgress('#prog-temp', temp, 50);

  if(document.querySelector('#prog-tds')){
    animateProgress('#prog-tds', tds, 1000);
  }

  // Chart Labels
  var labels = feeds.map(function (f) {
    var d = new Date(f.created_at);
    return d.getHours().toString().padStart(2,'0')
      + ':'
      + d.getMinutes().toString().padStart(2,'0');
  });

  // Chart Data
  var levelData = feeds.map(f => parseFloat(f.field1) || 0);
  var tempData  = feeds.map(f => parseFloat(f.field2) || 0);
  var turbData  = feeds.map(f => parseFloat(f.field3) || 0);
  var flowData  = feeds.map(f => parseFloat(f.field4) || 0);
  var tdsData   = feeds.map(f => parseFloat(f.field5) || 0);

  // Update Charts
  updateChart(charts.level, labels, levelData);
  updateChart(charts.flow, labels, flowData);
  updateChart(charts.temp, labels, tempData);

  if(charts.tds){
    updateChart(charts.tds, labels, tdsData);
  }

  // Alerts
  updateAlerts(level, tds, turb, temp);
}
/* ============================================================
   STATUS HELPERS
   ============================================================ */
function statusBadge(id, label, cls) {
  var $b = $(id);
  $b.removeClass('safe warning critical').addClass('db-badge ' + cls);
  $b.html('<i class="bi bi-circle-fill me-1" style="font-size:0.45rem"></i>' + label);
}
function setLevelStatus(v) {
  if (v >= THRESHOLDS.level.warn) statusBadge('#status-level','Normal','safe');
  else if (v >= THRESHOLDS.level.critical) statusBadge('#status-level','Low','warning');
  else statusBadge('#status-level','Critical','critical');
}
function setFlowStatus(v) {
  if (v <= THRESHOLDS.flow.warn) statusBadge('#status-flow','Normal','safe');
  else if (v <= THRESHOLDS.flow.critical) statusBadge('#status-flow','High','warning');
  else statusBadge('#status-flow','Overflow','critical');
}
function setTdsStatus(v) {
  if (v >= THRESHOLDS.tds.low && v <= THRESHOLDS.tds.high) statusBadge('#status-tds','Safe','safe');
  else if (v < 50 || v > 600) statusBadge('#status-tds','Unsafe','critical');
  else statusBadge('#status-tds','Warning','warning');
}
function setTurbStatus(v) {
  if (v < THRESHOLDS.turb.warn) statusBadge('#status-turb','Clear','safe');
  else if (v < THRESHOLDS.turb.critical) statusBadge('#status-turb','Cloudy','warning');
  else statusBadge('#status-turb','Turbid','critical');
}
function setTempStatus(v) {
  if (v < THRESHOLDS.temp.warn) statusBadge('#status-temp','Normal','safe');
  else if (v < THRESHOLDS.temp.critical) statusBadge('#status-temp','Warm','warning');
  else statusBadge('#status-temp','Hot','critical');
}

/* ============================================================
   ALERT PANEL UPDATE
   ============================================================ */
function updateAlerts(level, tds, turb, temp) {
  var alerts = [];
  var now = new Date();
  var timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  // Water Level alerts
  if (level < THRESHOLDS.level.critical) {
    alerts.push({ cls:'a-crit', icon:'bi-exclamation-triangle-fill', text:'<strong>Critical: Low Water Level</strong><small>Water level below ' + THRESHOLDS.level.critical + '% — Restrict pump operations</small>', time: timeStr });
  } else if (level < THRESHOLDS.level.warn) {
    alerts.push({ cls:'a-warn', icon:'bi-exclamation-circle-fill', text:'<strong>Warning: Low Water Level</strong><small>Water level is at ' + level.toFixed(1) + '%</small>', time: timeStr });
  } else {
    alerts.push({ cls:'a-safe', icon:'bi-check-circle-fill', text:'<strong>Water Level Normal</strong><small>Current level: ' + level.toFixed(1) + '%</small>', time: timeStr });
  }

  // TDS alerts
  if (tds > THRESHOLDS.tds.high) {
    alerts.push({ cls:'a-crit', icon:'bi-exclamation-triangle-fill', text:'<strong>Unsafe TDS Level Detected</strong><small>TDS value: ' + tds.toFixed(0) + ' ppm — High mineral concentration (Unsafe)</small>', time: timeStr });
  } else if (tds < THRESHOLDS.tds.low) {
    alerts.push({ cls:'a-warn', icon:'bi-exclamation-circle-fill', text:'<strong>Low TDS Level Warning</strong><small>TDS value: ' + tds.toFixed(0) + ' ppm — Mineral-depleted water</small>', time: timeStr });
  } else {
    alerts.push({ cls:'a-safe', icon:'bi-check-circle-fill', text:'<strong>TDS Level Safe</strong><small>TDS: ' + tds.toFixed(0) + ' ppm — Good mineral balance</small>', time: timeStr });
  }

  // Turbidity alerts
  if (turb >= THRESHOLDS.turb.critical) {
    alerts.push({ cls:'a-crit', icon:'bi-exclamation-triangle-fill', text:'<strong>High Turbidity Alert</strong><small>Turbidity: ' + turb.toFixed(1) + ' NTU — Suspended particles (High)</small>', time: timeStr });
  } else if (turb >= THRESHOLDS.turb.warn) {
    alerts.push({ cls:'a-warn', icon:'bi-exclamation-circle-fill', text:'<strong>Elevated Turbidity</strong><small>Turbidity: ' + turb.toFixed(1) + ' NTU — Water cloudy</small>', time: timeStr });
  } else {
    alerts.push({ cls:'a-safe', icon:'bi-check-circle-fill', text:'<strong>Turbidity Normal</strong><small>Water clarity is good: ' + turb.toFixed(1) + ' NTU</small>', time: timeStr });
  }

  // Temperature alerts
  if (temp >= THRESHOLDS.temp.critical) {
    alerts.push({ cls:'a-crit', icon:'bi-thermometer-high', text:'<strong>High Temperature Alert</strong><small>Temperature: ' + temp.toFixed(1) + '°C — Exceeds threshold</small>', time: timeStr });
  } else if (temp >= THRESHOLDS.temp.warn) {
    alerts.push({ cls:'a-warn', icon:'bi-thermometer-half', text:'<strong>Temperature Elevated</strong><small>Temperature: ' + temp.toFixed(1) + '°C</small>', time: timeStr });
  } else {
    alerts.push({ cls:'a-safe', icon:'bi-thermometer-low', text:'<strong>Temperature Normal</strong><small>Temperature: ' + temp.toFixed(1) + '°C</small>', time: timeStr });
  }

  // Connection alerts (Simulates connection state alert example)
  if (THINGSPEAK_CONFIG.channelId === 'YOUR_CHANNEL_ID') {
    // Demo Mode notice
    alerts.push({ cls:'a-warn', icon:'bi-cpu-fill', text:'<strong>ThingSpeak Link: Simulated</strong><small>Tuning demo data feeds — ESP32 link simulated</small>', time: timeStr });
  } else {
    // If live check succeeds/fails
    alerts.push({ cls:'a-safe', icon:'bi-wifi', text:'<strong>System Telemetry Online</strong><small>ESP32 node connected to cloud channel</small>', time: timeStr });
  }

  var html = '';
  alerts.forEach(function (a) {
    html += '<div class="alert-row ' + a.cls + '">'
          + '<div class="alert-indicator"></div>'
          + '<div class="alert-row-text">' + a.text + '</div>'
          + '<span class="alert-time">' + a.time + '</span>'
          + '</div>';
  });
  $('#alert-list').html(html);
}

/* ============================================================
   CHART INITIALIZATION
   ============================================================ */
function createChart(canvasId, label, color, gradientFrom, gradientTo) {
  var ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  var context = ctx.getContext('2d');
  var gradient = context.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, gradientFrom);
  gradient.addColorStop(1, gradientTo);

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: label,
        data: [],
        borderColor: color,
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.45,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(44,62,80,0.95)',
          borderColor: color,
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(30,136,229,0.06)', drawBorder: false },
          ticks: { color: '#607D8B', font: { size: 11 }, maxTicksLimit: 8 }
        },
        y: {
          grid: { color: 'rgba(30,136,229,0.06)', drawBorder: false },
          ticks: { color: '#607D8B', font: { size: 11 } }
        }
      }
    }
  });
}

function updateChart(chart, labels, data) {
  if (!chart) return;
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update('none');
}

/* ============================================================
   UI HELPERS
   ============================================================ */
function animateValue(selector, newValue) {
  var $el = $(selector);
  $el.addClass('updating');
  setTimeout(function () {
    $el.text(newValue).removeClass('updating');
  }, 200);
}

function animateProgress(selector, value, max) {
  var pct = Math.min(Math.max((value / max) * 100, 0), 100);
  $(selector).css('width', pct + '%').attr('aria-valuenow', pct);
}

function setRefreshIndicator(active) {
  if (active) {
    $('#refresh-icon').addClass('refresh-spin');
    $('#refresh-text').text('Fetching...');
  } else {
    $('#refresh-icon').removeClass('refresh-spin');
    $('#refresh-text').text('Auto-refresh: 15s');
  }
}

function updateLastFetched() {
  var now = new Date();
  var time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $('#last-updated').text('Last updated: ' + time);
}

function showDataError(msg) {
  console.warn(msg);
}

/* ============================================================
   COUNTDOWN TIMER FOR NEXT REFRESH
   ============================================================ */
var countdownVal = 15;
function startCountdown() {
  countdownVal = 15;
  clearInterval(window._countdownTimer);
  window._countdownTimer = setInterval(function () {
    countdownVal--;
    $('#countdown').text(countdownVal + 's');
    if (countdownVal <= 0) {
      countdownVal = 15;
      fetchSensorData();
    }
  }, 1000);
}




/* ============================================================
   INIT ON DOCUMENT READY
   ============================================================ */
$(document).ready(function () {

  // Initialize Charts
  charts.level = createChart('chartLevel', 'Water Level (%)', '#0F4C81', 'rgba(15,76,129,0.25)', 'rgba(15,76,129,0.0)');
  charts.flow  = createChart('chartFlow',  'Flow Rate (L/min)', '#00A8E8', 'rgba(0,168,232,0.25)', 'rgba(0,168,232,0.0)');
  charts.tds   = createChart('chartTds',   'TDS Level (ppm)', '#26A69A', 'rgba(38,166,154,0.25)', 'rgba(38,166,154,0.0)');
  charts.temp  = createChart('chartTemp',  'Temperature (°C)', '#FF7043', 'rgba(255,112,67,0.25)', 'rgba(255,112,67,0.0)');

  // Initial fetch
  fetchSensorData();

  // Start auto-refresh countdown
  startCountdown();

  // Manual refresh button
  $('#btn-refresh').on('click', function () {
    startCountdown();
    fetchSensorData();
  });

  // Mode switch: Demo / Live
  $('#btn-demo').on('click', function () {
    $(this).addClass('active');
    $('#btn-live').removeClass('active');
    THINGSPEAK_CONFIG.channelId = 'YOUR_CHANNEL_ID';
    fetchSensorData();
  });
  $('#btn-live').on('click', function () {
    $(this).addClass('active');
    $('#btn-demo').removeClass('active');
    fetchSensorData();
  });

});
