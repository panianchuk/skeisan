console.log("UC Button Fix JS wurde geladen");

(function () {
  function styleUcButtons() {
    var host = document.querySelector('aside#usercentrics-cmp-ui');
    if (!host || !host.shadowRoot) {
      return;
    }

    var root = host.shadowRoot;

    // Alle relevanten CTA-Buttons, egal welches Layout (Desktop/Mobile)
    var buttons = root.querySelectorAll(
      'button[data-action="consent"],' +
      'button[data-action="all"],' +
      'button[data-action="more"],' +
      'button.uc-accept-button,' +
      'button.uc-more-information-button'
    );

    buttons.forEach(function (btn) {
      btn.style.setProperty('font-size', '14px', 'important'); // ggf. 15/16px testen
      btn.style.setProperty('font-weight', '700', 'important');
    });
  }

  function init() {
    // Direkt beim Laden einmal probieren
    styleUcButtons();

    // Änderungen im DOM beobachten (falls UC später rendert oder Layout wechselt)
    var observer = new MutationObserver(function () {
      styleUcButtons();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

