'use strict';

export function trackTitle({ game, title }) {
  return `${game} - ${title}`;
}

export const dialogOptions = {
  autoOpen: false,
  show: 500,
  hide: 500,
};

export function initDialog(element, { icon }) {
  element.parent().find('.ui-dialog-title')
    .prepend($('<iconify-icon>', { icon }));
}

export function showDialog(element, dialog = 'dialog') {
  if (element[dialog]('isOpen')) {
    element[dialog]('moveToTop');
  } else {
    element[dialog]('open');
  }
  element.parent().find('.ui-dialog-titlebar button').blur();
}

export function time(t) {
  t = Math.floor(t)
  const sec = t % 60;
  const minHr = Math.floor(t/60);
  const min = minHr % 60;
  const hr = Math.floor(minHr / 60);
  return `${hr === 0 ? '' : hr + ':'}${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function size(bytes) {
  if (bytes == null) return bytes;
  const kb = Math.round(bytes / 1024 * 10) / 10;
  const mb = Math.round(kb / 1024 * 10) / 10;
  return kb < 500 ? `${kb} kB` : `${mb} MB`;
}

export function fetchAny(url) {
  return fetch(url, { credentials: 'include' }).then(response => {
    if (!response.ok) {
      throw new Error('http error');
    }
    return response;
  });
}

export function fetchJson(url) {
  return fetchAny(url).then(response => response.json());
}

export function escapeRegex(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function randomInt(range) {
  return Math.floor(Math.random() * range);
}

$.widget("custom.iconsselectmenu", $.ui.selectmenu, {
  _renderItem: function(ul, item) {
    ul.addClass('icons');
    const li = $("<li>", { class: item.disabled ? "ui-state-disabled" : "" }).append(
      $("<div>", { text: item.label }).append(
        $("<iconify-icon>", {
          style: item.element.attr("data-style"),
          'data-value': item.value,
          icon: item.element.attr("data-icon") || (!!item.element.attr("data-checked") ? "ph:check" : "ph:dot"),
        })
      )
    );
    return li.appendTo(ul);
  },
  super_drawButton: $.ui.selectmenu.prototype._drawButton,
  _drawButton: function() {
    this.super_drawButton();
    this.button.find('.ui-icon').remove();
    if (this.options.icons?.button)
      $("<iconify-icon>", {
        icon: this.options.icons?.button,
      }).appendTo(this.button);
  },
  superClose: $.ui.selectmenu.prototype.close,
  close() {
    if (!this.dontClose) this.superClose();
    this.dontClose = false;
  },
  preventClose() {
    this.dontClose = true;
  },
});

export function scrollToChild(container, child) {
  if (!container || !child) return;
  if (container.scrollTop <= child.offsetTop && container.scrollTop + container.offsetHeight >= child.offsetTop + child.offsetHeight)
    return;
  container.scrollTo({
    top: child.offsetTop + child.offsetHeight/2 - container.offsetHeight/2,
    behavior: 'smooth',
  });
}
