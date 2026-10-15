/* Mobile menu (hamburger): Squarespace's script used to open and close the overlay. Same behaviour, no dependencies. */
(function () {
  var btns = document.querySelectorAll('button.header-burger-btn'); /* the header has one per layout (two buttons) */
  var menu = document.querySelector('.header-menu');
  if (!btns.length || !menu) return;
  function setOpen(open) {
    document.body.classList.toggle('header--menu-open', open);
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      b.classList.toggle('burger--active', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      var ot = b.querySelector('.js-header-burger-open-title'), ct = b.querySelector('.js-header-burger-close-title');
      if (ot) ot.hidden = open;
      if (ct) ct.hidden = !open;
    }
    if (!open) showFolder('root');
  }
  function isOpen() { return document.body.classList.contains('header--menu-open'); }
  function showFolder(id) {
    var folders = menu.querySelectorAll('.header-menu-nav-folder');
    for (var i = 0; i < folders.length; i++) folders[i].classList.toggle('header-menu-nav-folder--active', folders[i].getAttribute('data-folder') === id);
    var ctl = menu.querySelector('.header-menu-controls-control');
    if (ctl) ctl.classList.toggle('header-menu-controls-control--active', id !== 'root');
  }
  for (var j = 0; j < btns.length; j++) {
    btns[j].removeAttribute('tabindex');
    btns[j].setAttribute('aria-expanded', 'false');
    btns[j].addEventListener('click', function (e) { e.preventDefault(); setOpen(!isOpen()); });
  }
  menu.addEventListener('click', function (e) {
    var folderLink = e.target.closest('[data-folder-id]');
    if (folderLink) { e.preventDefault(); showFolder(folderLink.getAttribute('data-folder-id')); return; }
    var back = e.target.closest('.header-menu-controls-control');
    if (back) { e.preventDefault(); showFolder('root'); return; }
    var link = e.target.closest('a[href]');
    if (link) setOpen(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) setOpen(false); });
  window.addEventListener('resize', function () { if (isOpen() && window.innerWidth > 1024) setOpen(false); });
})();
