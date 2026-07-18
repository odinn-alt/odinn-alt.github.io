/* ============================================================
   Interactive demos. Everything is client-side and canned:
   no network calls, no APIs, nothing leaves the page.
   Work-system demos use fictional companies and numbers.
   All animations progress by ELAPSED TIME so background-tab
   timer throttling can't stall them.
   ============================================================ */

'use strict';

function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   0. PAGE CHROME: portrait fallback + expand/collapse-all
   ============================================================ */
(function () {
  var img = document.getElementById('portrait-img');
  if (img) {
    var box = img.closest('.portrait');
    function markEmpty() { img.setAttribute('data-missing', ''); box.setAttribute('data-empty', ''); }
    if (img.complete && img.naturalWidth === 0) markEmpty();
    img.addEventListener('error', markEmpty);
  }

  document.querySelectorAll('.band-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var band = document.getElementById(btn.getAttribute('data-band'));
      var entries = band.querySelectorAll('details.entry');
      var anyClosed = Array.prototype.some.call(entries, function (d) { return !d.open; });
      entries.forEach(function (d) { d.open = anyClosed; });
      btn.textContent = anyClosed ? 'Collapse all' : 'Expand all';
    });
  });
})();

/* ============================================================
   1. INTEGRATION GATEWAY · drag & drop order intake
   ============================================================ */
(function () {
  var file = document.getElementById('gw-file');
  var drop = document.getElementById('gw-drop');
  var work = document.getElementById('gw-work');
  var tbody = document.querySelector('#gw-table tbody');
  var logBox = document.getElementById('gw-log');
  if (!file || !drop) return;

  var ORDERS = [
    { po: 'PO-88214', lines: 3, ship: 'Rochester, NY', oid: '#100241' },
    { po: 'PO-88215', lines: 1, ship: 'Columbus, OH', oid: '#100242' },
    { po: 'PO-88216', lines: 5, ship: 'Burlington, VT', oid: '#100243' }
  ];

  var LOG = [
    ['08:00:02', 'AUTH ', 'token cache hit: reusing WMS token (expires in 41 min)'],
    ['08:00:04', 'LOG  ', '3 requests + 3 responses written to the audit tables'],
    ['08:00:09', 'HOOK ', 'webhook: OrderConfirm received for #100238 (shipped yesterday)'],
    ['08:00:10', 'AUDIT', 'billing rule 1, international processing fee: OK'],
    ['08:00:10', 'AUDIT', 'billing rule 2, pick-fee units = item quantity: OK'],
    ['08:00:11', 'AUDIT', 'billing rule 3, small-parcel fee: MISMATCH (billed 4, expected 5)', 'warn'],
    ['08:00:11', 'FLAG ', '#100238 added to today’s discrepancy report', 'warn'],
    ['08:00:12', 'MAIL ', 'discrepancy report queued for the morning email to accounting'],
    ['08:00:12', 'DONE ', 'intake complete: 3 orders created, 1 billing catch, every call logged']
  ];

  var running = false;

  /* HTML5 drag & drop, with click/keyboard fallback for touch */
  file.addEventListener('dragstart', function (e) {
    e.dataTransfer.setData('text/plain', 'orders_0715.csv');
    e.dataTransfer.effectAllowed = 'move';
  });
  drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('is-over'); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('is-over'); run(); });
  file.addEventListener('click', run);
  file.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } });

  function run() {
    if (running) return;
    running = true;
    file.classList.add('is-gone');
    drop.classList.add('is-over');
    drop.innerHTML = '<span>orders_0715.csv received, parsing…</span>';
    work.hidden = false;
    tbody.innerHTML = '';
    logBox.innerHTML = '';

    /* rows appear, then each advances: received → validating → created */
    var rows = ORDERS.map(function (o) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + o.po + '</td><td>' + o.lines + '</td><td>' + o.ship + '</td><td class="st-wait">received</td>';
      tbody.appendChild(tr);
      return tr.lastChild;
    });

    var start = Date.now();
    var t = setInterval(function () {
      var el = Date.now() - start;
      rows.forEach(function (cell, i) {
        var phase = (el - i * 450) / 700;
        if (phase >= 2) { cell.className = 'st-ok'; cell.textContent = '✓ created ' + ORDERS[i].oid + ' (201)'; }
        else if (phase >= 1) { cell.className = 'st-wait'; cell.textContent = 'validating…'; }
      });
      if (el >= 2 * 700 + (rows.length - 1) * 450 + 200) {
        clearInterval(t);
        drop.innerHTML = '<span>✓ file processed</span>';
        tailLog();
      }
    }, 120);
  }

  function tailLog() {
    var start = Date.now(), shown = 0;
    var t = setInterval(function () {
      var target = Math.min(LOG.length, Math.floor((Date.now() - start) / 300) + 1);
      while (shown < target) {
        var L = LOG[shown];
        var div = document.createElement('div');
        div.className = 'gw-line' + (L[3] ? ' ' + L[3] : '');
        div.innerHTML = '<span class="t">[' + L[0] + ']</span> <span class="k">' + L[1] + '</span> ' + L[2];
        logBox.appendChild(div);
        shown++;
      }
      logBox.scrollTop = logBox.scrollHeight;
      if (shown >= LOG.length) {
        clearInterval(t);
        var note = document.createElement('div');
        note.className = 'gw-line note';
        note.innerHTML = 'Replay with fictional data. <span class="gw-reset" style="text-decoration:underline;cursor:pointer">Reset</span>';
        logBox.appendChild(note);
        note.querySelector('.gw-reset').addEventListener('click', reset);
        running = false;
      }
    }, 120);
  }

  function reset() {
    work.hidden = true;
    file.classList.remove('is-gone');
    drop.classList.remove('is-over');
    drop.innerHTML = '<span>drop the file here to run intake</span>';
  }
})();

/* ============================================================
   1a. GATEWAY TRANSPORT TABS: EDI, cart, and API pull replays
   ============================================================ */
(function () {
  var tabs = document.querySelectorAll('.gw-tab');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-on'); });
      tab.classList.add('is-on');
      document.querySelectorAll('.gw-panel').forEach(function (p) {
        p.hidden = p.getAttribute('data-gw') !== tab.getAttribute('data-gw');
      });
    });
  });

  function playLog(box, lines, done) {
    box.innerHTML = '';
    var start = Date.now(), shown = 0;
    var t = setInterval(function () {
      var target = Math.min(lines.length, Math.floor((Date.now() - start) / 340) + 1);
      while (shown < target) {
        var L = lines[shown];
        var div = document.createElement('div');
        div.className = 'gw-line' + (L[2] ? ' ' + L[2] : '');
        div.innerHTML = '<span class="k">' + L[0] + '</span> ' + L[1];
        box.appendChild(div);
        shown++;
      }
      box.scrollTop = box.scrollHeight;
      if (shown >= lines.length) {
        clearInterval(t);
        if (done) done();
      }
    }, 120);
  }

  /* --- EDI translate --- */
  var ediBtn = document.getElementById('edi-run');
  var ediBusy = false;
  if (ediBtn) {
    ediBtn.addEventListener('click', function () {
      if (ediBusy) return;
      ediBusy = true;
      ediBtn.disabled = true;
      playLog(document.getElementById('edi-out'), [
        ['READ ', '850 purchase order received via VAN, control #101'],
        ['PARSE', 'BEG segment: PO-88217, dated 2026-07-15'],
        ['PARSE', 'N1*ST ship-to resolved: Harbor & Pine Provisions (HP-01)'],
        ['PARSE', 'PO1 lines: 12 × HP-CANDLE-8OZ, 4 × HP-CRATE-SM'],
        ['CHECK', 'CTT count matches: 2 lines declared, 2 parsed'],
        ['POST ', '/orders: #100244 created (201), req/resp logged'],
        ['ACK  ', '997 functional acknowledgment queued back to the retailer'],
        ['NOTE ', 'Rigid on purpose: EDI fails loudly when a segment is wrong, and that is a feature.', 'note']
      ], function () { ediBtn.disabled = false; ediBtn.textContent = 'Run it again'; ediBusy = false; });
    });
  }

  /* --- Cart flow --- */
  var cartBtn = document.getElementById('cart-run');
  var cartBusy = false;
  if (cartBtn) {
    cartBtn.addEventListener('click', function () {
      if (cartBusy) return;
      cartBusy = true;
      cartBtn.disabled = true;
      var nodes = document.querySelectorAll('.cart-node');
      nodes.forEach(function (n) { n.classList.remove('is-hot'); });
      var start = Date.now();
      var lit = setInterval(function () {
        var step = Math.floor((Date.now() - start) / 550);
        nodes.forEach(function (n, i) { n.classList.toggle('is-hot', i <= step); });
        if (step >= 3) clearInterval(lit);
      }, 120);
      playLog(document.getElementById('cart-out'), [
        ['HOOK ', 'Shopify webhook: order #1027 placed at the client storefront'],
        ['ROUTE', 'CartRover normalizes the cart payload to the standard order format'],
        ['MAP  ', 'SKU aliases resolved against the client item map'],
        ['POST ', '/orders: #100245 created in the WMS (201)'],
        ['SYNC ', 'fulfillment + tracking will flow back to Shopify when it ships'],
        ['NOTE ', 'New store setup: connect, map SKUs, send a test order like this one. Config, not code.', 'note']
      ], function () { cartBtn.disabled = false; cartBtn.textContent = 'Run it again'; cartBusy = false; });
    });
  }

  /* --- API pull --- */
  var apiBtn = document.getElementById('api-run');
  var apiBusy = false;
  if (apiBtn) {
    apiBtn.addEventListener('click', function () {
      if (apiBusy) return;
      apiBusy = true;
      apiBtn.disabled = true;
      playLog(document.getElementById('api-out'), [
        ['AUTH ', 'client inventory system token refreshed (OAuth2)'],
        ['GET  ', '/orders?since=2026-07-14T20:00Z: 2 new orders'],
        ['POST ', '/orders: #100246 created (201)'],
        ['POST ', '/orders: #100247 created (201)'],
        ['GET  ', 'WMS stock levels for 214 client SKUs'],
        ['PUT  ', 'inventory counts pushed back to the client system'],
        ['NOTE ', 'Runs on a schedule. Both systems stay truthful without anyone re-keying numbers.', 'note']
      ], function () { apiBtn.disabled = false; apiBtn.textContent = 'Run it again'; apiBusy = false; });
    });
  }
})();

/* ============================================================
/* ============================================================
   1b. OUTBOUND ENGINE · interactive architecture map
   The real design; identifying details generalized.
   ============================================================ */
(function () {
  var map = document.getElementById('arch-map');
  if (!map) return;

  var detail = document.getElementById('arch-detail');
  var traceBtn = document.getElementById('arch-trace');

  var NODES = {
    icp: ['Apollo ICP lists', 'Prospect lists built in Apollo against our ideal customer profile: company size, what they ship, where they operate. These are true cold leads, so they start at the very bottom of the machine and have to earn their way up. Underneath them sits the deliverability plumbing I built first: dedicated sending subdomains, SPF, DKIM, and DMARC records, warmed mailboxes, GlockApps placement testing, and bounce verification before any first send.'],
    navigator: ['Manual prospecting, Sales Navigator', 'For higher-value targets I prospect by hand in LinkedIn Sales Navigator: researching the company, finding the right person, and writing sharper first touches. Slower per lead, better per message. These join the same sequences as the list-sourced leads.'],
    seq: ['Two cold sequences', 'Apollo runs two cold sequences, each with its own audience and messaging: personalized multi-step emails with automatic follow-ups. Every send, open, click, and reply feeds the lead score that decides whether a prospect ever moves up this tree.'],
    gate: ['The graduation gate', 'I set the score benchmarks, and leads only move up by earning it. Engagement above the bar graduates a lead out of cold outreach and into Zoho journeys. Leads that never engage stay cold and eventually age out. Nobody gets nurtured who has not shown a pulse.'],
    evergreen: ['The evergreen series', 'A standing drip of educational emails: cross-border shipping and warehousing fundamentals that stay relevant year-round, which is what evergreen means, content that never expires. Its job is warming. A freshly graduated lead keeps hearing from us with genuinely useful material instead of pitches.'],
    warm: ['Warm entries', 'Not everyone starts cold. Direct inquiries, trade show contacts, and referrals already know who we are and are already qualified, so they skip the cold machine entirely and drop straight into the nurture newsletter.'],
    newsletter: ['The nurture newsletter', 'A recurring, value-first email with industry updates, practical guidance, and company news. This is the long-term relationship channel: every qualified contact, cold graduate or warm entry alike, lives here until the timing is right. It keeps us the first name they think of when they need a 3PL.'],
    inquiry: ['Inquiry comes in', 'The system has produced a steady stream of these. Replies forward through a chain into a backend inbox, Claude AI reads the lead’s own words with the quoted thread stripped away, and an interested reply becomes a Contact, Account, and Deal in Zoho within the minute.'],
    close: ['Discovery to close', 'The last mile is deliberately human, and it is mine. I run the outreach conversations, the discovery calls, and the follow-ups, and I close the deals. New accounts have been signed as a direct result of this pipeline, cold list to signature.'],
    law: ['Compliance, end to end', 'The whole machine operates inside U.S. and Canadian anti-spam law: CAN-SPAM for U.S. recipients and CASL for Canadian ones. Every send identifies who we are, every email carries a working unsubscribe, and unsubscribes are honored permanently through Apollo’s suppression list.']
  };

  var TRACE = ['icp', 'seq', 'gate', 'evergreen', 'newsletter', 'inquiry', 'close'];
  var TRACE_NOTE = ['A cold list, matched to our ICP.', 'Sequence emails land in their inbox. They start opening.', 'Their lead score crosses my benchmark. They graduate.', 'Weeks of useful content, no pitches. They keep reading.', 'They join the long-term channel. We stay top of mind.', 'They reply asking for pricing. The deal exists within a minute.', 'I take the call, run discovery, and close the account.'];

  var nodes = map.querySelectorAll('.arch-node');
  var tracing = false;

  function show(key, traceNote) {
    var n = NODES[key];
    detail.innerHTML = '<strong>' + n[0] + (traceNote ? ' · ' + traceNote : '') + '</strong>' + n[1];
  }

  nodes.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (tracing) return;
      nodes.forEach(function (b) { b.classList.remove('is-on', 'is-hot'); });
      btn.classList.add('is-on');
      show(btn.getAttribute('data-a'));
    });
  });

  traceBtn.addEventListener('click', function () {
    if (tracing) return;
    tracing = true;
    traceBtn.disabled = true;
    nodes.forEach(function (b) { b.classList.remove('is-on', 'is-hot'); });

    var start = Date.now();
    var t = setInterval(function () {
      var step = Math.min(TRACE.length - 1, Math.floor((Date.now() - start) / 1500));
      TRACE.forEach(function (key, i) {
        var el = map.querySelector('[data-a="' + key + '"]');
        el.classList.toggle('is-hot', i === step);
        el.classList.toggle('is-on', i < step);
      });
      show(TRACE[step], 'step ' + (step + 1) + ' of ' + TRACE.length + ': ' + TRACE_NOTE[step]);
      if (Date.now() - start >= TRACE.length * 1500) {
        clearInterval(t);
        traceBtn.disabled = false;
        traceBtn.textContent = 'Trace it again';
        tracing = false;
      }
    }, 150);
  });
})();

/* ============================================================
/* ============================================================
   2. SALES TRACKER · sidebar miniature in the app's real skin
   Fictional companies and numbers throughout.
   ============================================================ */
(function () {
  var links = document.querySelectorAll('#w-st .stk-link');
  if (!links.length) return;

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      links.forEach(function (l) { l.classList.remove('is-on'); });
      link.classList.add('is-on');
      document.querySelectorAll('#w-st .stk-view').forEach(function (v) {
        v.hidden = v.getAttribute('data-v') !== link.getAttribute('data-v');
      });
    });
  });

  function typeInto(el, text, msPerChar, done) {
    var start = Date.now();
    var t = setInterval(function () {
      var i = Math.floor((Date.now() - start) / msPerChar);
      el.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(t); if (done) done(); }
    }, 40);
  }

  /* --- Conversations: classify + style-learned draft --- */
  var clsBtn = document.getElementById('stk-classify');
  var clsBusy = false;
  if (clsBtn) {
    clsBtn.addEventListener('click', function () {
      if (clsBusy) return;
      clsBusy = true;
      clsBtn.disabled = true;
      var chips = document.getElementById('stk-chips');
      var draft = document.getElementById('stk-draft');
      chips.innerHTML = '';
      var CHIPS = ['sales-relevant ✓', 'stage: warm', 'signal: meeting requested', 'category: fulfillment inquiry'];
      var start = Date.now(), shown = 0;
      var t = setInterval(function () {
        var target = Math.min(CHIPS.length, Math.floor((Date.now() - start) / 380) + 1);
        while (shown < target) {
          var s = document.createElement('span');
          s.className = 'stk-chip';
          s.textContent = CHIPS[shown];
          chips.appendChild(s);
          shown++;
        }
        if (shown >= CHIPS.length) {
          clearInterval(t);
          draft.hidden = false;
          typeInto(draft, 'Hi Dana,\n\nGreat to hear from you, and congrats on the growth. That is exactly the point where a 3PL starts paying for itself.\n\nHappy to walk you through onboarding. I have Thursday at 10 or Friday at 2 open for a quick call, and I will bring numbers for 250 orders a month so we are talking specifics, not theory.\n\nBest,\nOdinn', 12, function () {
            var note = document.createElement('p');
            note.className = 'stk-note';
            note.style.marginTop = '8px';
            note.textContent = 'Drafted in a style learned from my own sent mail: greeting, sign-off, tone, and length. Not a generic template.';
            draft.after(note);
            clsBtn.disabled = false;
            clsBusy = false;
          });
        }
      }, 120);
    });
  }

  /* --- Review: keep / dismiss --- */
  document.querySelectorAll('.stk-tri-card').forEach(function (card) {
    card.querySelector('.stk-keep').addEventListener('click', function () {
      card.classList.add('is-kept');
      card.querySelector('div').innerHTML = '<span class="stk-chip">✓ kept, now a lead in the pipeline</span>';
    });
    card.querySelector('.stk-dismiss').addEventListener('click', function () {
      card.classList.add('is-gone');
      card.querySelector('div').innerHTML = '<span class="stk-note">dismissed: hidden from sales views, never deleted, still searchable</span>';
    });
  });

  /* --- Pricing hub --- */
  var priceBtn = document.getElementById('stk-price');
  var priceBusy = false;
  if (priceBtn) {
    priceBtn.addEventListener('click', function () {
      if (priceBusy) return;
      priceBusy = true;
      priceBtn.disabled = true;
      var out = document.getElementById('stk-price-out');
      out.innerHTML = '';
      var ROWS = [
        ['Storage · 120 pallet positions', '$14.50 / pallet / mo'],
        ['Pick & pack · ~250 orders / mo', '$2.35 + $0.55 / item'],
        ['Bonded handling · Ontario inbound', 'after screening packet'],
        ['Account management', 'included']
      ];
      var start = Date.now(), shown = 0;
      var t = setInterval(function () {
        var target = Math.min(ROWS.length, Math.floor((Date.now() - start) / 420) + 1);
        while (shown < target) {
          var div = document.createElement('div');
          div.className = 'st-field';
          div.innerHTML = '<span>' + ROWS[shown][0] + '</span><span>' + ROWS[shown][1] + '</span>';
          out.appendChild(div);
          shown++;
        }
        if (shown >= ROWS.length) {
          clearInterval(t);
          var done = document.createElement('p');
          done.className = 'stk-note';
          done.style.marginTop = '10px';
          done.innerHTML = '<span class="stk-chip">✓ Word + PDF generated in our real template · deal drafted in the pipeline</span><br><br>Rates anchored to signed term sheets via Term Sheet Intelligence, illustrative here. Every saved sheet feeds the next proposal.';
          out.appendChild(done);
          priceBtn.disabled = false;
          priceBusy = false;
        }
      }, 120);
    });
  }

  /* --- Meetings: local Whisper transcription --- */
  var meetBtn = document.getElementById('stk-transcribe');
  var meetBusy = false;
  var SEGMENTS = [
    ['Speaker 1', 'So walk me through what happens the day our inventory shows up at your dock.'],
    ['Speaker 2', 'Truck checks in, we receive against your ASN, count and inspect, and stock is sellable in the system same day.'],
    ['Speaker 1', 'And the bonded piece, how does that work for our Ontario runs?'],
    ['Speaker 2', 'Bonded goods sit duty-unpaid until they ship to a customer. You defer the cash until the sale actually happens.']
  ];
  if (meetBtn) {
    meetBtn.addEventListener('click', function () {
      if (meetBusy) return;
      meetBusy = true;
      meetBtn.disabled = true;
      meetBtn.textContent = 'Transcribing on the office PC…';
      var grid = document.getElementById('stk-meet-grid');
      var tBox = document.getElementById('mi-transcript');
      var oBox = document.getElementById('mi-out');
      grid.hidden = false;
      tBox.innerHTML = '';
      oBox.innerHTML = '<p class="mi-idle">Whisper running locally, GPU-accelerated…</p>';
      var start = Date.now(), shown = 0;
      var t = setInterval(function () {
        var target = Math.min(SEGMENTS.length, Math.floor((Date.now() - start) / 850) + 1);
        while (shown < target) {
          var p = document.createElement('p');
          p.innerHTML = '<span class="who">' + SEGMENTS[shown][0] + ':</span>' + SEGMENTS[shown][1];
          tBox.appendChild(p);
          shown++;
        }
        tBox.scrollTop = tBox.scrollHeight;
        if (shown >= SEGMENTS.length) {
          clearInterval(t);
          setTimeout(function () {
            oBox.innerHTML =
              '<div class="mi-block"><h5>AI summary</h5><p>Prospect wants the receiving flow and bonded mechanics explained. Positive tone, close to a decision.</p></div>' +
              '<div class="mi-block"><h5>Action items</h5><ul><li>Send bonded screening packet</li><li>Confirm receiving SLA in writing</li></ul></div>' +
              '<div class="mi-block"><span class="mi-done">✓ filed to the company profile · copy-for-email ready</span></div>';
            meetBtn.disabled = false;
            meetBtn.textContent = 'Run it again';
            meetBusy = false;
          }, 700);
        }
      }, 120);
    });
  }

  /* --- Capture: business card scan --- */
  var scanBtn = document.getElementById('stk-scan');
  var scanBusy = false;
  if (scanBtn) {
    scanBtn.addEventListener('click', function () {
      if (scanBusy) return;
      scanBusy = true;
      scanBtn.disabled = true;
      var out = document.getElementById('stk-scan-out');
      out.innerHTML = '';
      var FIELDS = [
        ['Name', 'Dana Reyes'],
        ['Title', 'VP Operations'],
        ['Company', 'Cedar Peak Outdoors'],
        ['Email', 'dana@cedarpeakoutdoors.com'],
        ['Event', 'grouped: trade show batch']
      ];
      var start = Date.now(), shown = 0;
      var t = setInterval(function () {
        var target = Math.min(FIELDS.length, Math.floor((Date.now() - start) / 350) + 1);
        while (shown < target) {
          var div = document.createElement('div');
          div.className = 'st-field';
          div.innerHTML = '<span>' + FIELDS[shown][0] + '</span><span>' + FIELDS[shown][1] + '</span>';
          out.appendChild(div);
          shown++;
        }
        if (shown >= FIELDS.length) {
          clearInterval(t);
          var done = document.createElement('p');
          done.className = 'stk-note';
          done.style.marginTop = '10px';
          done.innerHTML = '<span class="stk-chip">✓ cross-checked against the mailbox: no prior thread, new lead created</span><br><br>Claude vision reads the card. This is the one deliberate cloud exception to local-AI-by-default, because card photos are unstructured images.';
          out.appendChild(done);
          scanBtn.disabled = false;
          scanBusy = false;
        }
      }, 120);
    });
  }

  /* --- Analytics: loss reasons + exports --- */
  var loss = document.getElementById('stk-loss');
  if (loss) {
    var REASONS = [['Price', 2], ['Timing', 1], ['Went dark', 1]];
    REASONS.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'spend-row';
      row.innerHTML = '<span class="app">' + r[0] + '</span><span class="bar"><i style="width:' + (r[1] / 2 * 100) + '%"></i></span><span class="amt">' + r[1] + '</span>';
      loss.appendChild(row);
    });
  }
  ['stk-pdf', 'stk-xlsx'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', function () {
      b.textContent = '✓ generated';
      setTimeout(function () { b.textContent = id === 'stk-pdf' ? 'Board PDF' : 'Excel export'; }, 1600);
    });
  });

  /* --- Outbound: Zoho bridge one-click write --- */
  var zBtn = document.getElementById('stk-zoho-btn');
  if (zBtn) {
    zBtn.addEventListener('click', function () {
      zBtn.disabled = true;
      zBtn.textContent = '✓ 1 record written';
      document.getElementById('stk-zoho-note').textContent = 'Tag applied + linked follow-up task created in Zoho. One confirmed click, one immediate write. Never automatic, never batched.';
    });
  }
})();

/* ============================================================
   3. CONTENT STUDIO · voice × format factory (real interface)
   Demo content; the voice and format rules are the real ones.
   ============================================================ */
(function () {
  var nav = document.querySelectorAll('#w-cs .stk-link');
  if (!nav.length) return;

  nav.forEach(function (link) {
    link.addEventListener('click', function () {
      nav.forEach(function (l) { l.classList.remove('is-on'); });
      link.classList.add('is-on');
      document.querySelectorAll('#w-cs .stk-view').forEach(function (v) {
        v.hidden = v.getAttribute('data-v') !== link.getAttribute('data-v');
      });
    });
  });

  var fmt = 'linkedin', voice = 'company', busy = false;
  var modelNote = document.getElementById('cst-model');

  function pillGroup(boxId, attr, cb) {
    var box = document.getElementById(boxId);
    box.querySelectorAll('.cst-pill').forEach(function (p) {
      p.addEventListener('click', function () {
        if (busy) return;
        box.querySelectorAll('.cst-pill').forEach(function (x) { x.classList.remove('is-on'); });
        p.classList.add('is-on');
        cb(p.getAttribute(attr));
      });
    });
  }
  pillGroup('cst-formats', 'data-fmt', function (v) { fmt = v; syncModel(); });
  pillGroup('cst-voices', 'data-voice', function (v) { voice = v; syncModel(); });

  function deepRun() { return voice === 'academic' || fmt !== 'linkedin'; }
  function syncModel() {
    modelNote.textContent = deepRun()
      ? 'Model: auto · Sonnet, deep run · 2 variants'
      : 'Model: auto · Haiku, fast & cheap · 3 variants';
  }

  var LI = {
    company: 'The $800 de minimis exemption built a generation of import businesses. Now it\u2019s being rewritten.\n\nIf your landed-cost math assumes duty-free parcels forever, this is the year to model the alternative: consolidated freight into bonded storage, duties deferred until goods actually sell into U.S. commerce.\n\nThe brands that plan for the rule change before it lands won\u2019t just survive it. They\u2019ll pick up the customers of the ones that didn\u2019t.\n\n#Logistics #CrossBorder #Ecommerce #BondedWarehouse #SupplyChain',
    academic: 'Recent reporting points to a structural shift in U.S. import economics: the de minimis pathway is narrowing faster than most importers modeled.\n\nThree observations stand out. Enforcement attention is rising. Consolidated bonded entry is emerging as the compliant alternative in trade coverage. And landed-cost models built on duty-free parcels are being repriced across the sector.\n\nThe evidence suggests supply chains built on the exemption are not waiting for a final rule to adapt.\n\n#TradePolicy #SupplyChain #Customs #Imports #Logistics',
    founder: 'Every week I talk to a brand whose entire margin depends on de minimis staying exactly the way it is.\n\nThat\u2019s not a strategy. That\u2019s a bet.\n\nWe\u2019ve started walking clients through the bonded alternative well before the rules move, because the worst time to redesign your supply chain is the week you\u2019re forced to.\n\n#Logistics #CrossBorder #Leadership #SupplyChain #Ecommerce',
    personal: 'Been reading the de minimis proposals so you don\u2019t have to. Short version: the duty-free parcel era is ending. Gradually, then suddenly.\n\nThe interesting part isn\u2019t the policy. It\u2019s watching which importers modeled this two years ago and which ones are discovering the word \u201cbonded\u201d this quarter.\n\n#SupplyChain #Logistics #CrossBorder #Trade #Ecommerce'
  };

  var NL_TITLES = {
    company: 'The Monthly Brief: The De Minimis Clock Is Ticking',
    academic: 'The Monthly Brief: Reading the De Minimis Data',
    founder: 'The Monthly Brief: What I\u2019d Do Before the Rules Change',
    personal: 'The Monthly Brief: The Loophole Everyone Priced In'
  };

  var BLOG_H1 = {
    company: 'De Minimis Reform Is a Cash-Flow Problem, Not a Tariff Problem',
    academic: 'What the De Minimis Data Actually Shows: A Research Brief',
    founder: 'The De Minimis Bet Importers Don\u2019t Know They\u2019re Making',
    personal: 'The Duty-Free Era Is Ending. Here\u2019s the Math That Replaces It.'
  };

  var genBtn = document.getElementById('cst-gen');
  genBtn.addEventListener('click', function () {
    if (busy) return;
    busy = true;
    genBtn.disabled = true;
    var log = document.getElementById('cst-runlog');
    var out = document.getElementById('cst-out');
    log.innerHTML = '';
    out.innerHTML = '';

    var deep = deepRun();
    var LOG = [
      ['CACHE', 'pre-warm hit: shared system prompt reads at ~10% price'],
      ['DRAFT', (deep ? '2' : '3') + ' angles in parallel: operational reality · contrarian take · process story'],
      ['JUDGE', voice === 'academic' ? 'one note: citation phrasing tightened, conditional rewrite applied' : 'clean pass, draft kept as-is, no rewrite cost']
    ];

    var start = Date.now(), shown = 0;
    var t = setInterval(function () {
      var target = Math.min(LOG.length, Math.floor((Date.now() - start) / 600) + 1);
      while (shown < target) {
        var div = document.createElement('div');
        div.className = 'gw-line';
        div.innerHTML = '<span class="k">' + LOG[shown][0] + '</span> ' + LOG[shown][1];
        log.appendChild(div);
        shown++;
      }
      if (shown >= LOG.length) {
        clearInterval(t);
        renderVariant(out, deep);
      }
    }, 120);
  });

  function renderVariant(out, deep) {
    var card = document.createElement('div');
    card.className = 'cst-variant';
    var cost = fmt === 'linkedin' ? (voice === 'academic' ? '$0.06' : '$0.02') : (voice === 'academic' ? '$0.14' : '$0.09');
    var model = deep ? 'sonnet' : 'haiku';

    var body = '';
    if (fmt === 'linkedin') {
      body = LI[voice];
    } else if (fmt === 'newsletter') {
      body = NL_TITLES[voice] + '\n\n1. A disarming opening, not a pitch\n2. What changed this month\n3. What it means for importers\n4. The bonded alternative, explained\n5. One practical checklist\n6. What we\u2019re watching next\n\nIts own house voice. No hashtags, no hard sell.';
    } else {
      body = 'H1: ' + BLOG_H1[voice] + '\n\nH2: The exemption that built an industry\nH2: What the enforcement signals say\nH2: Bonded entry, the compliant alternative\nH2: The cash-flow math, worked through\n\nMeta description: drafted. 700-1,300 words. MLA works cited: 2 sources.';
    }

    var chars = fmt === 'linkedin' ? body.length + '/3,000 chars' : (fmt === 'blog' ? '700-1,300 words' : '4-6 sections');
    card.innerHTML =
      '<div class="cst-variant-meta"><span>angle: operational reality</span><span>' + chars + '</span><span>model: ' + model + '</span><span>run cost: ' + cost + '</span></div>' +
      '<div class="cst-text" id="cst-text"></div>' +
      '<div class="cst-facts" id="cst-facts"></div>';
    out.appendChild(card);

    var textEl = card.querySelector('#cst-text');
    var start = Date.now();
    var t = setInterval(function () {
      var i = Math.floor((Date.now() - start) * 0.5);
      textEl.textContent = body.slice(0, i);
      if (i >= body.length) {
        clearInterval(t);
        var facts = card.querySelector('#cst-facts');
        facts.innerHTML =
          '<p><span class="ok">\u2713</span>Verified: Section 321 threshold ($800) checked against statute</p>' +
          '<p><span class="q">?</span>To verify before posting: enforcement timeline, still moving</p>' +
          (voice === 'academic' ? '<p><span class="ok">\u2713</span>MLA first comment ready: 2 real sources with title, author, outlet, date, live URL</p>' : '') +
          '<p><span class="ok">\u2713</span>Graphic kit ready: art direction for this voice + 2 real photos matched from the gallery</p>';
        genBtn.disabled = false;
        genBtn.textContent = 'Generate again';
        busy = false;
      }
    }, 40);
  }

  /* --- Discover --- */
  var scanBtn = document.getElementById('cst-scan');
  var scanBusy = false;
  var TOPICS = [
    { pri: true, label: 'De minimis enforcement accelerates', src: 'Reuters trade desk · this morning' },
    { pri: false, label: 'Carriers announce GRIs earlier than usual', src: 'FreightWaves · rate season signal' },
    { pri: false, label: '\u201cbonded warehouse\u201d searches climbing, no matching article', src: 'site analytics · content gap' }
  ];
  if (scanBtn) {
    scanBtn.addEventListener('click', function () {
      if (scanBusy) return;
      scanBusy = true;
      scanBtn.disabled = true;
      var box = document.getElementById('cst-topics');
      box.innerHTML = '';
      var start = Date.now(), shown = 0;
      var t = setInterval(function () {
        var target = Math.min(TOPICS.length, Math.floor((Date.now() - start) / 450) + 1);
        while (shown < target) { addTopic(box, TOPICS[shown]); shown++; }
        if (shown >= TOPICS.length) {
          clearInterval(t);
          scanBtn.textContent = '3 topics found · saved to the database';
          scanBusy = false;
        }
      }, 120);
    });
  }

  function addTopic(box, tp) {
    var card = document.createElement('div');
    card.className = 'cst-topic-card';
    card.innerHTML = '<p>' + (tp.pri ? '<span class="pri">priority · </span>' : '') + tp.label + '<em>' + tp.src + '</em></p>';
    var use = document.createElement('button');
    use.className = 'd-btn';
    use.textContent = 'Use in Create';
    use.addEventListener('click', function () {
      document.getElementById('cst-topic').textContent = tp.label + ' (source attached)';
      document.querySelector('#w-cs .stk-link[data-v="create"]').click();
    });
    card.appendChild(use);
    box.appendChild(card);
  }

  /* --- Library: respin --- */
  var respin = document.getElementById('cst-respin');
  if (respin) {
    respin.addEventListener('click', function () {
      respin.disabled = true;
      respin.textContent = '\u2713 respun';
      document.getElementById('cst-respin-note').textContent = 'The winning personal post (4.8% engagement) was handed back into Create as a fresh run with the same topic and voice. Winners become templates.';
    });
  }
})();

/* ============================================================
   3a. CARD DECK · fan on hover, lightbox on click
   ============================================================ */
(function () {
  var deck = document.getElementById('cover-deck');
  if (!deck) return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll('.deck-card'));

  /* build the lightbox once */
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.hidden = true;
  lb.innerHTML =
    '<button class="lb-close" aria-label="Close">✕</button>' +
    '<button class="lb-nav lb-prev" aria-label="Previous">‹</button>' +
    '<img alt="">' +
    '<p class="lb-cap"></p>' +
    '<button class="lb-nav lb-next" aria-label="Next">›</button>';
  document.body.appendChild(lb);

  var lbImg = lb.querySelector('img');
  var lbCap = lb.querySelector('.lb-cap');
  var current = 0;

  function show(i) {
    current = (i + cards.length) % cards.length;
    lbImg.src = cards[current].getAttribute('href');
    lbImg.alt = cards[current].querySelector('img').alt;
    lbCap.innerHTML = cards[current].getAttribute('data-cap');
    lb.hidden = false;
  }
  function close() { lb.hidden = true; }

  cards.forEach(function (card, i) {
    card.addEventListener('click', function (e) {
      /* on touch layouts the deck fans first, then opens */
      e.preventDefault();
      show(i);
    });
  });

  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();

/* ============================================================
   3b. THE LOADING DOCK · working replica of the live blog index
   Real titles, covers, and deks from the public blog.
   ============================================================ */
(function () {
  var door = document.getElementById('ld-door');
  if (!door) return;

  var POSTS = [
    { cat: 'trends', img: 'assets/creative/blog-what-is-3pl.jpg', catLabel: 'Industry Trends', date: 'Jul 10, 2026', title: 'What Is a 3PL, and When Does Your Brand Actually Need One?' },
    { cat: 'trends', img: 'assets/creative/blog-bonded.jpg', catLabel: 'Industry Trends', date: 'Jul 10, 2026', title: 'Breaking Into U.S. Commerce: How a Bonded Warehouse Helps Canadian Shippers Defer Duties' },
    { cat: 'tips', img: 'assets/creative/blog-7-signs.jpg', catLabel: 'Operational Tips', date: 'Jul 10, 2026', title: '7 Signs You\\u2019ve Outgrown Self-Fulfillment' },
    { cat: 'tips', img: 'assets/creative/blog-peak-season.jpg', catLabel: 'Operational Tips', date: 'Jul 10, 2026', title: 'Peak Season Prep: The 3PL Checklist to Start in July' }
  ];

  /* build the post grid */
  var grid = document.getElementById('ld-grid');
  var cards = POSTS.map(function (p) {
    var card = document.createElement('div');
    card.className = 'ld-card';
    card.setAttribute('data-cat', p.cat);
    card.innerHTML = '<img src="' + p.img + '" alt="" loading="lazy"><div class="ld-card-body"><p class="ld-card-meta">' + p.catLabel + ' \\u00b7 ' + p.date + '</p><p class="ld-card-title">' + p.title + '</p></div>';
    grid.appendChild(card);
    return card;
  });
  var empty = document.createElement('p');
  empty.className = 'ld-empty';
  empty.textContent = 'No posts match. The real search behaves the same way, honestly.';
  empty.hidden = true;
  grid.after(empty);

  /* the arrival: lamp flips, door rolls up */
  var lamp = document.getElementById('ld-lamp');
  var opened = false;
  function arrive() {
    if (opened) return;
    opened = true;
    lamp.textContent = 'CLEAR TO ENTER';
    lamp.classList.add('is-clear');
    setTimeout(function () { door.classList.add('is-open'); }, 450);
  }
  door.addEventListener('click', arrive);
  door.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); arrive(); } });

  /* featured rotator: fixed height, auto-cycling */
  var featTitle = document.getElementById('ld-feat-title');
  var featIdx = 0;
  featTitle.textContent = POSTS[0].title;
  setInterval(function () {
    featIdx = (featIdx + 1) % POSTS.length;
    featTitle.textContent = POSTS[featIdx].title;
  }, 3200);

  /* category pills + live search, combined filter */
  var activeCat = 'all';
  var query = '';
  function applyFilter() {
    var any = false;
    cards.forEach(function (card, i) {
      var okCat = activeCat === 'all' || POSTS[i].cat === activeCat;
      var okQ = !query || POSTS[i].title.toLowerCase().indexOf(query) !== -1;
      card.hidden = !(okCat && okQ);
      if (okCat && okQ) any = true;
    });
    empty.hidden = any;
  }
  document.querySelectorAll('.ld-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.querySelectorAll('.ld-pill').forEach(function (p) { p.classList.remove('is-on'); });
      pill.classList.add('is-on');
      activeCat = pill.getAttribute('data-cat');
      applyFilter();
    });
  });
  document.getElementById('ld-search').addEventListener('input', function (e) {
    query = e.target.value.trim().toLowerCase();
    applyFilter();
  });
})();

/* ============================================================
   4. STRATEGY LAB · run the gauntlet (trader-terminal skin)
   ============================================================ */
(function () {
  var canvas = document.getElementById('lab-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var runBtn = document.getElementById('lab-run');
  var msg = document.getElementById('lab-msg');
  var verdictBox = document.getElementById('lab-verdict');
  var checksBox = document.getElementById('lab-checks');
  var lessonEl = document.getElementById('lab-lesson');

  var BUILD_DAYS = 2520;
  var UNSEEN_DAYS = 600;

  var STRATS = {
    momentum: {
      seed: 11,
      build: [{ d: 2520, m: 0.00075, v: 0.011 }],
      unseen: [{ d: 130, m: 0.0009, v: 0.011 }, { d: 170, m: -0.0032, v: 0.017 }, { d: 300, m: 0.00012, v: 0.012 }],
      lesson: '<strong>Failed.</strong> Ten years of looking brilliant, then the unseen years took over a third of it away. Strategies that memorize the past instead of learning something true are exactly what the gauntlet exists to catch.'
    },
    meanrev: {
      seed: 23,
      build: [{ d: 2520, m: 0.00034, v: 0.0035 }],
      unseen: [{ d: 600, m: 0.00005, v: 0.003 }],
      lesson: '<strong>Failed.</strong> It wins small amounts very often, which feels great, and then trading costs eat every bit of it. A high win rate is not the same thing as an edge.'
    },
    crypto: {
      seed: 37,
      build: [{ d: 900, m: 0.0028, v: 0.035 }, { d: 500, m: -0.0058, v: 0.045 }, { d: 1120, m: 0.0021, v: 0.033 }],
      unseen: [{ d: 200, m: 0.0032, v: 0.034 }, { d: 190, m: -0.0075, v: 0.05 }, { d: 210, m: 0.0018, v: 0.034 }],
      lesson: '<strong>Failed.</strong> The returns were spectacular and so was the crash. A drawdown near 80% is not an investment strategy, it is a coin flip with better marketing.'
    },
    ensemble: {
      seed: 52,
      build: [{ d: 1200, m: 0.00042, v: 0.0058 }, { d: 320, m: -0.0011, v: 0.009 }, { d: 1000, m: 0.00052, v: 0.0056 }],
      unseen: [{ d: 240, m: 0.00082, v: 0.0055 }, { d: 120, m: -0.0007, v: 0.008 }, { d: 240, m: 0.00088, v: 0.0054 }],
      lesson: '<strong>Passed.</strong> Nothing heroic in it, just uncorrelated parts doing boring work in parallel. This is the one that survived the one-shot test, and a version of it runs my paper account today.'
    }
  };

  var BENCH = {
    seed: 99,
    build: [{ d: 2520, m: 0.00026, v: 0.0052 }],
    unseen: [{ d: 600, m: 0.00010, v: 0.0052 }]
  };

  function genReturns(spec) {
    var rand = mulberry32(spec.seed);
    var out = [];
    spec.build.concat(spec.unseen).forEach(function (seg) {
      for (var i = 0; i < seg.d; i++) {
        var g = (rand() + rand() + rand() - 1.5) * 2;
        out.push(seg.m + g * seg.v);
      }
    });
    return out;
  }

  function toEquity(rets) {
    var eq = [1];
    for (var i = 0; i < rets.length; i++) eq.push(eq[i] * (1 + rets[i]));
    return eq;
  }

  function stats(rets, days) {
    var eq = toEquity(rets);
    var years = days / 252;
    var cagr = Math.pow(eq[eq.length - 1], 1 / years) - 1;
    var mean = 0, i;
    for (i = 0; i < rets.length; i++) mean += rets[i];
    mean /= rets.length;
    var vari = 0;
    for (i = 0; i < rets.length; i++) vari += (rets[i] - mean) * (rets[i] - mean);
    var sd = Math.sqrt(vari / rets.length);
    var sharpe = sd === 0 ? 0 : (mean / sd) * Math.sqrt(252);
    var peak = eq[0], maxDD = 0;
    for (i = 1; i < eq.length; i++) {
      if (eq[i] > peak) peak = eq[i];
      var dd = eq[i] / peak - 1;
      if (dd < maxDD) maxDD = dd;
    }
    return { cagr: cagr, sharpe: sharpe, maxDD: maxDD, total: eq[eq.length - 1] - 1 };
  }

  var chosen = null;
  var animTimer = null;

  document.querySelectorAll('.lab-pick').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.lab-pick').forEach(function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');
      chosen = btn.getAttribute('data-strategy');
      runBtn.disabled = false;
      msg.hidden = false;
      msg.textContent = 'Ready. Run it.';
      verdictBox.hidden = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  });

  var C_STRAT = '#34d9a4', C_BENCH = '#6b7388', C_TEXT = '#9aa3b5',
      C_GRID = 'rgba(255,255,255,0.09)', C_BOUND = 'rgba(154,163,181,0.4)';

  function drawFrame(sEq, bEq, upto, boundary) {
    var W = canvas.width, H = canvas.height, PAD = 12;
    ctx.clearRect(0, 0, W, H);

    var n = sEq.length;
    var min = Infinity, max = -Infinity, i;
    for (i = 0; i < n; i++) {
      if (sEq[i] < min) min = sEq[i];
      if (sEq[i] > max) max = sEq[i];
      if (bEq[i] < min) min = bEq[i];
      if (bEq[i] > max) max = bEq[i];
    }
    var pad = (max - min) * 0.08;
    min -= pad; max += pad;

    function x(i2) { return PAD + (i2 / (n - 1)) * (W - PAD * 2); }
    function y(v) { return H - PAD - ((v - min) / (max - min)) * (H - PAD * 2); }

    var bx = x(boundary);
    ctx.strokeStyle = C_BOUND;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(bx, PAD); ctx.lineTo(bx, H - PAD); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C_TEXT;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('build years', bx - 8, PAD + 14);
    if (upto > boundary) {
      ctx.textAlign = 'left';
      ctx.fillText('never seen before', bx + 8, PAD + 14);
    }

    ctx.strokeStyle = C_GRID;
    ctx.beginPath(); ctx.moveTo(PAD, y(1)); ctx.lineTo(W - PAD, y(1)); ctx.stroke();

    function plot(eq, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x(0), y(eq[0]));
      for (var j = 1; j <= upto; j++) ctx.lineTo(x(j), y(eq[j]));
      ctx.stroke();
    }
    plot(bEq, C_BENCH, 1.5);
    plot(sEq, C_STRAT, 2.2);

    ctx.fillStyle = C_STRAT;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('strategy', PAD + 4, H - PAD - 6);
    ctx.fillStyle = C_BENCH;
    ctx.fillText('60/40 benchmark', PAD + 74, H - PAD - 6);
  }

  function fmtPct(v) { return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%'; }

  runBtn.addEventListener('click', function () {
    if (!chosen || animTimer) return;
    var spec = STRATS[chosen];
    var sRets = genReturns(spec);
    var bRets = genReturns(BENCH);
    var sEq = toEquity(sRets);
    var bEq = toEquity(bRets);
    var boundary = BUILD_DAYS;
    var total = sEq.length - 1;

    verdictBox.hidden = true;
    msg.hidden = false;
    msg.textContent = 'Testing on the build years…';
    runBtn.disabled = true;

    var start = Date.now(), DUR = 2600;
    animTimer = setInterval(function () {
      var frac = Math.min(1, (Date.now() - start) / DUR);
      var upto = Math.max(1, Math.round(frac * total));
      if (upto >= boundary) {
        msg.textContent = 'Now the one-shot: years the strategy has never seen…';
      }
      drawFrame(sEq, bEq, upto, boundary);
      if (frac >= 1) {
        clearInterval(animTimer);
        animTimer = null;
        finish(sRets, bRets);
      }
    }, 16);

    function finish(sAll, bAll) {
      msg.hidden = true;
      runBtn.disabled = false;

      var st = stats(sAll.slice(BUILD_DAYS), UNSEEN_DAYS);
      var bt = stats(bAll.slice(BUILD_DAYS), UNSEEN_DAYS);

      var checks = [
        { name: 'Grows at least 8% a year', val: fmtPct(st.cagr) + ' / yr', ok: st.cagr >= 0.08 },
        { name: 'Return worth its volatility (Sharpe ≥ 0.6)', val: st.sharpe.toFixed(2), ok: st.sharpe >= 0.6 },
        { name: 'Never loses more than 25% from a peak', val: fmtPct(st.maxDD) + ' worst', ok: st.maxDD >= -0.25 },
        { name: 'Beats just holding a 60/40 portfolio', val: fmtPct(st.total) + ' vs ' + fmtPct(bt.total), ok: st.total > bt.total }
      ];

      checksBox.innerHTML = '';
      checks.forEach(function (c) {
        var div = document.createElement('div');
        div.className = 'lab-check ' + (c.ok ? 'ok' : 'no');
        div.innerHTML = '<span>' + c.name + '</span><span class="val">' + (c.ok ? '✓ ' : '✕ ') + c.val + '</span>';
        checksBox.appendChild(div);
      });

      lessonEl.innerHTML = STRATS[chosen].lesson;
      verdictBox.hidden = false;
    }
  });
})();

/* ============================================================
   4b. TRADER CONSOLE · tabs, day replay, bridge reconcile
   ============================================================ */
(function () {
  var tabs = document.querySelectorAll('.tr-tab');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-on'); });
      tab.classList.add('is-on');
      document.querySelectorAll('.tr-panel').forEach(function (p) {
        p.hidden = p.getAttribute('data-tr') !== tab.getAttribute('data-tr');
      });
    });
  });

  function playLog(box, lines, done) {
    box.innerHTML = '';
    var start = Date.now(), shown = 0;
    var t = setInterval(function () {
      var target = Math.min(lines.length, Math.floor((Date.now() - start) / 340) + 1);
      while (shown < target) {
        var L = lines[shown];
        var div = document.createElement('div');
        div.className = 'gw-line' + (L[2] ? ' ' + L[2] : '');
        div.innerHTML = (L[0] ? '<span class="k">' + L[0] + '</span> ' : '') + L[1];
        box.appendChild(div);
        shown++;
      }
      box.scrollTop = box.scrollHeight;
      if (shown >= lines.length) {
        clearInterval(t);
        if (done) done();
      }
    }, 120);
  }

  function wireReplay(btnId, boxId, lines) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    var busy = false;
    btn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      btn.disabled = true;
      playLog(document.getElementById(boxId), lines, function () {
        btn.disabled = false;
        btn.textContent = 'Run it again';
        busy = false;
      });
    });
  }

  wireReplay('day-run', 'day-log', [
    ['09:31', '803 symbols swept, 3 candidates pass the pattern screen'],
    ['09:33', 'risk gates: stop distance vs volatility, exposure, cooldowns. 1 of 3 clears'],
    ['09:34', 'entry placed, protective stop set before the fill confirms'],
    ['11:20', 'winner check: position green, add-on tranche placed, stop ratcheted up'],
    ['15:50', 'exit manager trims into the close, cooldown recorded on the symbol'],
    ['16:05', 'ledger updated: every decision journaled for the cohort studies'],
    ['16:10', 'hourly report pushed to my phone: positions, P/L, what changed and why'],
    ['17:30', 'arena recomputes all fourteen sleeves, determinism canary checks the math'],
    ['20:00', 'research mode: the scanner journals overnight candidates for future study'],
    ['', 'A replay of the shape of a real session. Paper money throughout.', 'note']
  ]);

  wireReplay('bridge-run', 'bridge-log', [
    ['17:45', 'champion spec computes targets: index core, sector sleeves, cash sleeve'],
    ['17:45', 'reconcile: broker positions vs local books, position by position'],
    ['17:45', 'guard chain: foreign positions? drift beyond tolerance? plan executable?'],
    ['17:46', 'all guards clear: rebalance orders queued for the next open, sized from last close'],
    ['17:46', 'plan and orders journaled to the lab database, push notification sent'],
    ['', 'If any guard fails, the bridge refuses the entire plan and says why. It has refused before. That is the design working.', 'note'],
    ['', 'Circuit breakers sit outside the validated drawdown envelope: halve exposure at level one, flatten and halt at level two.', 'note']
  ]);
})();

/* ============================================================
   5. CBLE PREP · three real past-exam questions
   ============================================================ */
(function () {
  var stage = document.getElementById('cble-stage');
  if (!stage) return;

  var QUESTIONS = [
    {
      exam: 'April 2023 exam',
      stem: 'How long after attaining a passing grade on the Customs Broker License Exam does an applicant have to apply for a Customs broker license?',
      options: { A: 'Three (3) months', B: 'One (1) year', C: 'Two (2) years', D: 'Three (3) years', E: 'Five (5) years' },
      correct: 'D',
      cite: '19 CFR 111.11(a)(4)',
      why: 'Passing the exam starts a clock: you have three years to actually apply for the license before the passing grade expires.'
    },
    {
      exam: 'October 2022 exam',
      stem: 'Whose bond is liable when merchandise is delivered directly to a container station from an importing carrier before the merchandise is formally receipted?',
      options: { A: 'Importer of Record', B: 'Customs Broker', C: 'Container Station', D: 'Bonded Warehouse', E: 'Importing Carrier' },
      correct: 'E',
      cite: '19 CFR 19.44(a)',
      why: 'Until the container station formally receipts the goods, responsibility has not transferred, so they are still riding on the importing carrier’s bond.'
    },
    {
      exam: 'October 2022 exam',
      stem: 'What is the classification of a seasoning blend consisting of 42% turmeric, 37% rosemary, 10% onion, 5% garlic, 3% salt, and 3% black pepper, packaged for sale to potato chip manufacturers?',
      options: { A: '0910.30.0000', B: '0910.91.0000', C: '2005.20.0020', D: '2103.90.8000', E: '2103.90.9091' },
      correct: 'D',
      cite: 'HTSUS heading 2103',
      why: 'Feels like it should be a spice (chapter 9), but as a mixed seasoning it classifies under heading 2103 for mixed condiments. Welcome to tariff classification, where your instincts go to die.'
    }
  ];

  var idx = 0, score = 0;

  function renderQuestion() {
    var q = QUESTIONS[idx];
    stage.innerHTML = '';

    var prog = document.createElement('div');
    prog.className = 'cble-progress';
    prog.textContent = 'QUESTION ' + (idx + 1) + ' / ' + QUESTIONS.length + ' · ' + q.exam;
    stage.appendChild(prog);

    var stem = document.createElement('p');
    stem.className = 'cble-stem';
    stem.textContent = q.stem;
    stage.appendChild(stem);

    var opts = document.createElement('div');
    opts.className = 'cble-opts';
    Object.keys(q.options).forEach(function (key) {
      var b = document.createElement('button');
      b.className = 'cble-opt';
      b.innerHTML = '<span class="key">' + key + '</span><span>' + q.options[key] + '</span>';
      b.addEventListener('click', function () { answer(key, opts, q); });
      opts.appendChild(b);
    });
    stage.appendChild(opts);
  }

  function answer(key, opts, q) {
    var right = key === q.correct;
    if (right) score++;

    Array.prototype.forEach.call(opts.children, function (b, i) {
      b.disabled = true;
      var k = Object.keys(q.options)[i];
      if (k === q.correct) b.classList.add('is-right');
      else if (k === key) b.classList.add('is-wrong');
      else b.classList.add('is-dim');
    });

    var fb = document.createElement('div');
    fb.className = 'cble-feedback';
    fb.innerHTML = '<strong>' + (right ? 'Correct.' : 'Not quite, it’s ' + q.correct + '.') + '</strong> ' +
      q.why + '<span class="cite">' + q.cite + '</span>';
    stage.appendChild(fb);

    var next = document.createElement('button');
    next.className = 'd-btn cble-next';
    next.textContent = idx + 1 < QUESTIONS.length ? 'Next question' : 'See how you did';
    next.addEventListener('click', function () {
      idx++;
      if (idx < QUESTIONS.length) renderQuestion();
      else renderScore();
    });
    stage.appendChild(next);
  }

  function renderScore() {
    stage.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'cble-score';
    var pct = Math.round((score / QUESTIONS.length) * 100);
    box.innerHTML =
      '<h3>' + score + ' of ' + QUESTIONS.length + ' (' + pct + '%)</h3>' +
      '<p>' + (pct >= 75
        ? 'That clears the 75% passing bar. The real exam is 80 of these in four and a half hours, open book across thousands of pages of regulation.'
        : 'The bar is 75%, and most people don’t clear it. The real exam is 80 of these in four and a half hours, open book across thousands of pages of regulation. That’s why I built a study platform.') + '</p>';
    var again = document.createElement('button');
    again.className = 'd-btn';
    again.textContent = 'Try again';
    again.addEventListener('click', function () { idx = 0; score = 0; renderQuestion(); });
    box.appendChild(again);
    stage.appendChild(box);
  }

  renderQuestion();
})();

/* ============================================================
   5b. CBLE CONSOLE · tabs, exam room, freshness check
   ============================================================ */
(function () {
  var tabs = document.querySelectorAll('.cb-tab');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-on'); });
      tab.classList.add('is-on');
      document.querySelectorAll('.cb-panel').forEach(function (p) {
        p.hidden = p.getAttribute('data-cb') !== tab.getAttribute('data-cb');
      });
    });
  });

  /* --- exam room: ticking timer, flag, refs overlay, one question, review --- */
  var timerEl = document.getElementById('mk-timer');
  if (timerEl) {
    var examStart = Date.now();
    var TOTAL = 84 * 60 * 1000; /* 25 questions at the real pace */
    setInterval(function () {
      var left = Math.max(0, TOTAL - (Date.now() - examStart));
      var m = Math.floor(left / 60000);
      var s = Math.floor((left % 60000) / 1000);
      timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      if (m < 30) timerEl.classList.add('is-low');
    }, 500);

    var flagged = false;
    var flagBtn = document.getElementById('mk-flag');
    flagBtn.addEventListener('click', function () {
      flagged = !flagged;
      flagBtn.classList.toggle('is-flagged', flagged);
      flagBtn.innerHTML = flagged ? '&#9873; flagged' : '&#9873; flag for review';
    });

    var overlay = document.getElementById('mk-overlay');
    document.getElementById('mk-refs').addEventListener('click', function () { overlay.hidden = false; });
    document.getElementById('mk-close').addEventListener('click', function () { overlay.hidden = true; });

    var OPTS = { A: 'Three (3) months', B: 'One (1) year', C: 'Two (2) years', D: 'Three (3) years', E: 'Five (5) years' };
    var picked = null;
    var optsBox = document.getElementById('mk-opts');
    var submitBtn = document.getElementById('mk-submit');
    Object.keys(OPTS).forEach(function (key) {
      var b = document.createElement('button');
      b.className = 'cble-opt';
      b.innerHTML = '<span class="key">' + key + '</span><span>' + OPTS[key] + '</span>';
      b.addEventListener('click', function () {
        picked = key;
        optsBox.querySelectorAll('.cble-opt').forEach(function (o) { o.classList.remove('is-right'); });
        b.classList.add('is-right');
        submitBtn.disabled = false;
      });
      optsBox.appendChild(b);
    });

    var submitted = false;
    submitBtn.addEventListener('click', function () {
      if (submitted) return;
      submitted = true;
      var right = picked === 'D';
      var review = document.getElementById('mk-review');
      review.innerHTML =
        '<div class="cble-feedback"><strong>Review screen.</strong> ' +
        'You answered 1 of 25, ' + (flagged ? 'flagged 1 for review, ' : '') +
        'and this one was ' + (right ? 'correct' : 'wrong, the answer is D') + '. ' +
        'In a real session the review screen lists all 25 with filters for unanswered and flagged before you commit, ' +
        'unanswered questions are simply not graded, and the result replays every question with an explanation on demand.' +
        '<span class="cite">19 CFR 111.11(a)(4) &middot; the citation is a deep link in the real app</span></div>';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Session submitted';
    });
  }

  /* --- freshness check replay --- */
  var refsBtn = document.getElementById('refs-run');
  if (refsBtn) {
    var busy = false;
    refsBtn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      refsBtn.disabled = true;
      var box = document.getElementById('refs-log');
      var LINES = [
        ['CFR  ', 'querying the official eCFR source for Title 19 amendments'],
        ['CFR  ', 'latest amendment matches the in-app copy: current, nothing to do'],
        ['HTSUS', 'current revision confirmed against the published schedule'],
        ['CBP  ', 'guidance documents fetched and page counts verified against the held copies'],
        ['STAMP', 'freshness dates updated, visible in the app so stale never hides'],
        ['', 'When Washington changes something, the app updates itself and re-verifies every citation link.', 'note']
      ];
      box.innerHTML = '';
      var start = Date.now(), shown = 0;
      var t = setInterval(function () {
        var target = Math.min(LINES.length, Math.floor((Date.now() - start) / 380) + 1);
        while (shown < target) {
          var L = LINES[shown];
          var div = document.createElement('div');
          div.className = 'gw-line' + (L[2] ? ' ' + L[2] : '');
          div.innerHTML = (L[0] ? '<span class="k">' + L[0] + '</span> ' : '') + L[1];
          box.appendChild(div);
          shown++;
        }
        box.scrollTop = box.scrollHeight;
        if (shown >= LINES.length) {
          clearInterval(t);
          refsBtn.disabled = false;
          refsBtn.textContent = 'Check again';
          busy = false;
        }
      }, 120);
    });
  }
})();

/* ============================================================
   6. EVE · scripted chat (mission-control skin)
   ============================================================ */
(function () {
  var log = document.getElementById('eve-log');
  var chipsBox = document.getElementById('eve-chips');
  if (!log || !chipsBox) return;

  var SCRIPT = [
    {
      q: 'What is EVE, exactly?',
      a: 'I’m Odinn’s personal assistant. I live on his own hardware, remember our conversations, write him a market brief every afternoon, and send about thirty kinds of notifications to his phone. He built me because he wanted an assistant that answers to him, not to a subscription.'
    },
    {
      q: 'What’s under the hood?',
      a: 'A Python backend, a React front end installed on his phone like an app, and a routing layer that gives easy questions to models running locally and hard ones to a cloud model. My memory is plain files he can open and edit. No mystery boxes.'
    },
    {
      q: 'What else has he built?',
      a: 'You’re standing in the middle of it. The exam platform, the strategy gauntlet, and the listing generator on this page are all his. So are the work systems above me. I’m just the one that talks.'
    },
    {
      q: 'Is he good to work with?',
      a: 'I’m contractually biased, but: he ships, he verifies his own work, and he reads the error logs before asking anyone for help. He also refuses to let me push a notification he’d ignore, which tells you something about how he builds.'
    },
    {
      q: 'How do I reach him?',
      a: 'Email odinnmcloughlin@gmail.com. He actually answers.'
    }
  ];

  var busy = false;

  function addMsg(text, who) {
    var div = document.createElement('div');
    div.className = 'eve-msg from-' + who;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function typeOut(el, text, done) {
    el.classList.add('typing');
    var start = Date.now();
    var t = setInterval(function () {
      var i = Math.floor((Date.now() - start) / 9);
      el.textContent = text.slice(0, i);
      log.scrollTop = log.scrollHeight;
      if (i >= text.length) {
        clearInterval(t);
        el.classList.remove('typing');
        if (done) done();
      }
    }, 18);
  }

  function setChips(disabled) {
    Array.prototype.forEach.call(chipsBox.children, function (c) { c.disabled = disabled; });
  }

  SCRIPT.forEach(function (item) {
    var chip = document.createElement('button');
    chip.className = 'eve-chip';
    chip.textContent = item.q;
    chip.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      setChips(true);
      addMsg(item.q, 'you');
      var el = addMsg('', 'eve');
      setTimeout(function () {
        typeOut(el, item.a, function () {
          busy = false;
          setChips(false);
        });
      }, 350);
    });
    chipsBox.appendChild(chip);
  });

  var hello = addMsg('', 'eve');
  typeOut(hello, 'Hello. I’m a small scripted stand-in for the real EVE, which stays home on Odinn’s machines. Ask me about him.');
})();

/* ============================================================
   6b. EVE CONSOLE · today cockpit, notifications, brief
   ============================================================ */
(function () {
  var tabs = document.querySelectorAll('.ev-tab');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-on'); });
      tab.classList.add('is-on');
      document.querySelectorAll('.ev-panel').forEach(function (p) {
        p.hidden = p.getAttribute('data-ev') !== tab.getAttribute('data-ev');
      });
    });
  });

  /* --- Today: live clock, countdown, inline action items --- */
  var clock = document.getElementById('ev-clock');
  if (clock) {
    var eventAt = Date.now() + 47 * 60 * 1000;
    setInterval(function () {
      clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      var left = Math.max(0, eventAt - Date.now());
      var m = Math.floor(left / 60000);
      var s = Math.floor((left % 60000) / 1000);
      var count = document.getElementById('ev-count');
      if (count) count.textContent = 'in ' + m + ':' + (s < 10 ? '0' : '') + s;
      var rem = document.getElementById('ev-next-rem');
      if (rem) rem.textContent = 'next ' + (m + 1) + 'm';
    }, 500);

    document.querySelectorAll('.ev-action').forEach(function (btn) {
      btn.addEventListener('click', function () { btn.classList.toggle('is-done'); });
    });
  }

  /* --- Notifications: the nag that will not be ignored --- */
  var nagBtn = document.getElementById('nag-run');
  if (nagBtn) {
    var nagTimer = null;
    nagBtn.addEventListener('click', function () {
      if (nagTimer) return;
      nagBtn.disabled = true;
      var box = document.getElementById('ev-nags');
      box.innerHTML = '';
      var count = 0;
      var start = Date.now();

      function stopNag() {
        clearInterval(nagTimer);
        nagTimer = null;
        var done = document.createElement('p');
        done.className = 'ev-nag-done';
        done.textContent = 'Acknowledged after ' + count + ' push' + (count === 1 ? '' : 'es') + '. The nag stops the moment you respond. In real life this fires every minute with hard caps, so it can never nag forever, but it also never gives up quietly.';
        box.appendChild(done);
        nagBtn.disabled = false;
        nagBtn.textContent = 'Trigger it again';
      }

      function pushNag() {
        count++;
        var card = document.createElement('div');
        card.className = 'ev-nag';
        card.innerHTML = '<span>&#9200; Leave for the client call <em>nag ' + count + '</em></span>';
        var ack = document.createElement('button');
        ack.className = 'd-btn';
        ack.textContent = 'Acknowledge';
        ack.addEventListener('click', stopNag);
        card.appendChild(ack);
        box.appendChild(card);
        box.scrollTop = box.scrollHeight;
        if (Date.now() - start > 20000) stopNag(); /* demo safety cap */
      }

      pushNag();
      nagTimer = setInterval(pushNag, 2500);
    });
  }

  /* --- Daily brief: eight sections reveal --- */
  var briefBtn = document.getElementById('brief-run');
  if (briefBtn) {
    var briefBusy = false;
    var SECTIONS = [
      ['1 · Market snapshot', 'indexes, breadth, and where the day closed'],
      ['2 · What moved and why', 'the session\\u2019s real story, not just tickers'],
      ['3 · Sector heat', 'what led, what lagged, what rotated'],
      ['4 · Macro & calendar', 'data prints and what tomorrow brings'],
      ['5 · Portfolio check', 'positions, P/L, and anything needing a decision'],
      ['6 · Headlines that matter', 'filtered hard, noise discarded'],
      ['7 · Risk radar', 'what could hurt, and how exposed the book is'],
      ['8 · Tomorrow\\u2019s setup', 'what EVE is watching at the open']
    ];
    briefBtn.addEventListener('click', function () {
      if (briefBusy) return;
      briefBusy = true;
      briefBtn.disabled = true;
      var box = document.getElementById('ev-brief');
      box.innerHTML = '';
      var start = Date.now(), shown = 0;
      var t = setInterval(function () {
        var target = Math.min(SECTIONS.length, Math.floor((Date.now() - start) / 350) + 1);
        while (shown < target) {
          var div = document.createElement('div');
          div.className = 'st-field';
          div.innerHTML = '<span>' + SECTIONS[shown][0] + '</span><span>' + SECTIONS[shown][1] + '</span>';
          box.appendChild(div);
          shown++;
        }
        if (shown >= SECTIONS.length) {
          clearInterval(t);
          var note = document.createElement('p');
          note.className = 'ev-nag-done';
          note.textContent = 'The shape of the real thing. Generated every afternoon on schedule, pushed to my phone, archived in the Briefs view.';
          box.appendChild(note);
          briefBtn.disabled = false;
          briefBtn.textContent = 'Generate it again';
          briefBusy = false;
        }
      }, 120);
    });
  }
})();

/* ============================================================
   7. STITCH WITCH · listing generator (void/bone/blood skin)
   ============================================================ */
(function () {
  var picksBox = document.getElementById('sw-picks');
  var out = document.getElementById('sw-out');
  if (!picksBox || !out) return;

  var PIECES = [
    {
      kind: 'Hand-bleached denim',
      title: 'Hand-Bleached Sun & Moon Levi’s Jacket',
      price: 78,
      desc: 'A 90s Levi’s trucker jacket pulled from a thrift bin and reborn. Hand-bleached sun on the back, crescent moon on the chest pocket. Fabric-painted detail in deep burgundy and bone.',
      details: ['Bleached by hand under low light', 'Detail painted with permanent fabric paint', 'Heat-set, machine washable cold inside out']
    },
    {
      kind: 'Embroidered knit',
      title: 'Embroidered Wildflower Cardigan',
      price: 52,
      desc: 'A soft vintage cardigan reworked with hand-embroidered wildflowers climbing the button placket. Quiet, warm, one of one.',
      details: ['Hand-embroidered floral chain', 'Original buttons kept', 'Gentle wash, lay flat to dry']
    },
    {
      kind: 'Painted tee',
      title: 'Painted Phoenix Black Tee',
      price: 42,
      desc: 'A heavyweight black tee carrying a hand-painted phoenix across the back, done in bone and ember tones. Made to be worn, not framed.',
      details: ['Painted freehand, no stencils', 'Heat-set fabric paint', 'Machine washable cold inside out']
    }
  ];

  var phaseEl = document.getElementById('sw-phase');
  var listing = document.getElementById('sw-listing');
  var busy = false;

  PIECES.forEach(function (p) {
    var b = document.createElement('button');
    b.className = 'sw-pick';
    b.innerHTML = '<span class="sw-kind">' + p.kind + '</span><strong>' + p.title + '</strong>';
    b.addEventListener('click', function () { if (!busy) run(p, b); });
    picksBox.appendChild(b);
  });

  function run(p, btn) {
    busy = true;
    document.querySelectorAll('.sw-pick').forEach(function (x) { x.classList.remove('is-on'); });
    btn.classList.add('is-on');
    out.hidden = false;
    listing.innerHTML =
      '<div class="sw-title" id="sw-title"></div>' +
      '<div class="sw-price" id="sw-price"></div>' +
      '<div class="sw-desc" id="sw-desc"></div>' +
      '<ul class="sw-details" id="sw-details"></ul>';

    var phases = ['reading the photos…', 'checking condition + materials…', 'pricing against the catalog…'];
    phaseEl.innerHTML = phases[0];
    var start = Date.now();
    var pt = setInterval(function () {
      var pi = Math.floor((Date.now() - start) / 650);
      if (pi < phases.length) {
        phaseEl.innerHTML = phases[pi];
      } else {
        clearInterval(pt);
        phaseEl.innerHTML = '<span class="done">✓ listing drafted, waiting for one human confirmation</span>';
        write(p);
      }
    }, 120);
  }

  function type(el, text, speed, done) {
    var start = Date.now();
    var t = setInterval(function () {
      var i = Math.floor((Date.now() - start) * 2 / speed);
      el.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(t); if (done) done(); }
    }, speed);
  }

  function write(p) {
    var titleEl = document.getElementById('sw-title');
    var priceEl = document.getElementById('sw-price');
    var descEl = document.getElementById('sw-desc');
    var detailsEl = document.getElementById('sw-details');

    type(titleEl, p.title, 24, function () {
      priceEl.textContent = '$' + p.price + ' · one of one';
      type(descEl, p.desc, 12, function () {
        p.details.forEach(function (d, i) {
          setTimeout(function () {
            var li = document.createElement('li');
            li.textContent = d;
            detailsEl.appendChild(li);
            if (i === p.details.length - 1) busy = false;
          }, 200 * (i + 1));
        });
      });
    });
  }
})();
