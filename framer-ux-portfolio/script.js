(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.hasAttribute('hidden');
      if (open) {
        mobileNav.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
      } else {
        mobileNav.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /* Project filter */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.project-card');
  var emptyMsg = document.getElementById('filter-empty');

  function setActiveFilter(activeBtn) {
    filterBtns.forEach(function (b) {
      var on = b === activeBtn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function cardMatches(card, filter) {
    if (card.getAttribute('data-always') === 'true') return true;
    if (filter === 'all') return true;
    var cats = (card.getAttribute('data-cats') || '').trim();
    return cats === filter;
  }

  function applyFilter(filter) {
    var visible = 0;
    cards.forEach(function (card) {
      var show = cardMatches(card, filter);
      if (show) {
        card.removeAttribute('hidden');
        visible += 1;
      } else {
        card.setAttribute('hidden', '');
      }
    });
    if (emptyMsg) {
      if (visible === 0) emptyMsg.removeAttribute('hidden');
      else emptyMsg.setAttribute('hidden', '');
    }
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter') || 'all';
      setActiveFilter(btn);
      applyFilter(f);
    });
  });

  /* Reveal on scroll */
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var nodes = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && nodes.length) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io.unobserve(e.target);
            }
          });
        },
        { rootMargin: '0px 0px -5% 0px', threshold: 0.05 },
      );
      nodes.forEach(function (n) {
        io.observe(n);
      });
    } else {
      nodes.forEach(function (n) {
        n.classList.add('is-visible');
      });
    }
  } else {
    document.querySelectorAll('.reveal').forEach(function (n) {
      n.classList.add('is-visible');
    });
  }
})();
