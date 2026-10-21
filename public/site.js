// Menu op kleine schermen
(function () {
  var knop = document.querySelector('.menuknop');
  var menu = document.getElementById('menu');
  if (knop && menu) {
    knop.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      knop.setAttribute('aria-expanded', open ? 'true' : 'false');
      knop.textContent = open ? 'Sluiten' : 'Menu';
    });
  }

  // Printknop; trainersblokken open zetten bij printen
  document.querySelectorAll('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('details').forEach(function (d) { d.setAttribute('open', ''); });
  });

  // Vriendschapsstijl-test
  var plek = document.querySelector('[data-stijltest]');
  if (!plek) return;
  var vragen = [
    ['L', 'In een gesprek stel ik meer vragen dan dat ik over mezelf vertel.'],
    ['L', 'Mensen vertellen mij vaak persoonlijke dingen.'],
    ['A', 'Ik stel graag nieuwe activiteiten voor.'],
    ['A', 'Ik raak snel enthousiast over nieuwe mensen en plannen.'],
    ['V', 'Ik stel mensen graag aan elkaar voor.'],
    ['V', 'Ik voel me prettig in een groep.'],
    ['S', 'Als een vriend het moeilijk heeft, sta ik klaar.'],
    ['S', 'Ik heb liever een paar vrienden voor het leven dan veel kennissen.']
  ];
  var stijlen = {
    L: ['De luisteraar', 'Je geeft aandacht en onthoudt wat anderen vertellen. Oefen met meer over jezelf delen, zodat anderen jou ook leren kennen.'],
    A: ['De avonturier', 'Je brengt energie en neemt mensen mee in nieuwe dingen. Oefen met echt luisteren en doorvragen.'],
    V: ['De verbinder', 'Je brengt mensen bij elkaar. Oefen met tijd maken voor één persoon tegelijk.'],
    S: ['De steunpilaar', 'Je bent trouw en betrouwbaar. Oefen met zelf het initiatief nemen.']
  };
  var keuzes = [['0', 'Klopt niet'], ['1', 'Een beetje'], ['2', 'Klopt']];
  var form = document.createElement('form');
  form.className = 'stijltest';
  form.setAttribute('aria-label', 'Test: wat is jouw vriendschapsstijl?');
  form.innerHTML = vragen.map(function (v, i) {
    return '<fieldset><legend>' + (i + 1) + '. ' + v[1] + '</legend><div class="keuzes">' +
      keuzes.map(function (k) {
        return '<label><input type="radio" name="v' + i + '" value="' + k[0] + '"> ' + k[1] + '</label>';
      }).join('') + '</div></fieldset>';
  }).join('') +
    '<button type="submit" class="knop">Bekijk mijn stijl</button><div class="uitslag" aria-live="polite"></div>';
  plek.replaceWith(form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var score = { L: 0, A: 0, V: 0, S: 0 };
    var beantwoord = 0;
    vragen.forEach(function (v, i) {
      var gekozen = form.querySelector('input[name="v' + i + '"]:checked');
      if (gekozen) { beantwoord++; score[v[0]] += Number(gekozen.value); }
    });
    var uit = form.querySelector('.uitslag');
    if (beantwoord < vragen.length) {
      uit.innerHTML = '<p class="melding">Beantwoord alle ' + vragen.length + ' uitspraken. Je hebt er nu ' + beantwoord + ' ingevuld.</p>';
      return;
    }
    var max = Math.max(score.L, score.A, score.V, score.S);
    var top = Object.keys(score).filter(function (k) { return score[k] === max; });
    uit.innerHTML = top.map(function (k) {
      return '<p><strong>' + stijlen[k][0] + '</strong>: ' + stijlen[k][1] + '</p>';
    }).join('') + (top.length > 1 ? '<p class="melding">Je scoort even hoog op meerdere stijlen. Dat betekent dat je flexibel bent.</p>' : '');
  });
})();
