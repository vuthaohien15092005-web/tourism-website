// Reading Progress Component - reusable across client pages
(function(){
  if (typeof window === 'undefined') return;

  var PROGRESS_ID = 'reading-progress';

  function createBar(){
    if (document.getElementById(PROGRESS_ID)) return;
    var bar = document.createElement('div');
    bar.id = PROGRESS_ID;
    document.body.appendChild(bar);
  }

  function getScrollPercent(){
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var docHeight = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    if (docHeight <= 0) return 0;
    var percent = (scrollTop / docHeight) * 100;
    if (percent < 0) percent = 0; else if (percent > 100) percent = 100;
    return percent;
  }

  var ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var bar = document.getElementById(PROGRESS_ID);
      if (bar) bar.style.setProperty('--progress', getScrollPercent() + '%');
      ticking = false;
    });
  }

  function init(){
    try { createBar(); } catch(e) {}
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


