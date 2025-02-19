'use strict';

import { customEncodeURIComponent  } from './common.js';

const ROOT_URL = document.getElementsByTagName('base')[0].href;
const ROOT_PATH = document.getElementsByTagName('base')[0].attributes.href.value;

let subscribers = [];

export function subscribeState(subscriber) {
  subscribers.unshift(subscriber);
  notify(subscriber);
}

export function unsubscribeState(subscriber) {
  subscribers = subscribers.filter(s => s !== subscriber);
}

export function pushState(state, segments) {
  const routePath = (segments) => `${segments.map(s => customEncodeURIComponent(s)).join('/')}`;
  history.pushState(state, '', ROOT_URL + routePath(segments));
  updateRoute();
}

export function pushUrl(url) {
  const route = fromURL(url);
  pushState(route.state, route.segments);
}

function fromURL(path) {
  const stripPrefix = (s, p) => s.startsWith(p) ? s.slice(p.length) : s;
  const split = (s, d) => s === '' ? [] : s.split(d);
  const customDecode = s => s.replace(/_/g, ' ');
  const segments = split(customDecode(stripPrefix(path, ROOT_PATH)), '/').map(s => decodeURIComponent(s));
  return { state: { platform: segments[0], game: segments[1] }, segments };
}

function notify(subscriber) {
  subscriber(history.state ?? fromURL(location.pathname).state)
}
function updateRoute() {
  subscribers.forEach(subscriber => notify(subscriber));
}

window.onpopstate = () => {
  updateRoute();
};
updateRoute();
