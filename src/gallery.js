'use strict';

import { loadScreenshots } from './db.js';
import { user } from './login.js';
import { player } from './player.js';
import { dialogOptions, initDialog, showDialog } from "./utils.js";

$('#galleryDialog').dialog({
	...dialogOptions,
    width: 640,
    height: 480+40,
    position: { my: "center", at: "center", of: window },
});
initDialog($('#galleryDialog'), { icon: 'ph:monitor-play' });

export function show() {
  showDialog($('#galleryDialog'));
}

let galleryIndex = undefined;
let galleryCache = {};
loadScreenshots().then(res => {
    galleryIndex = res;
});

function setLoading(loading) {
	$('#galleryDialog .loader')
		.toggleClass('on', loading)
		.toggleClass('off', !loading);
}

let demo = false;
user.then(user => {
	demo = !!user.demo;
	$('#galleryDialog .demo').toggle(demo);
});

player.addEventListener('entry', ({ detail: { game, title } }) => {
	const entry = galleryIndex.find(entry => entry.game === game);
	if (!entry) {
		setGallery(undefined, game);
		return;
	}
	if (galleryCache[game]) {
		showGallery(galleryCache[game]);
		return;
	}
	function showGallery(gameGallery) {
		const trackGallery = gameGallery?.tracks?.find(track => track.title === title);
		setGallery(demo ? gameGallery?.demoScreenshots : trackGallery?.screenshots ?? gameGallery?.screenshots, game);
	}
	setLoading(true);
	fetch(entry.index, { credentials: 'include' }).then(response => response.json()).then(preprocessGallery(entry.index)).then(gallery => {
		gallery.forEach(entry => {
			galleryCache[entry.game] = entry;
		});
		showGallery(gallery.find(entry => entry.game === game));
	}).catch(e => {
		setGallery(undefined, game);
		throw e;
	}).finally(() => {
		setLoading(false);
	});
});

const INTERVAL_SEC = 10;
let galleryStatus = {
	list: null,
	index: 0,
};
let galleryInterval;
function setGallery(gallery, game) {
	if (galleryStatus.list != null &&
		(gallery?.length ?? 0) === galleryStatus.list.length &&
		galleryStatus.list.every((item, i) => item === gallery[i]) &&
		(galleryStatus.list.length > 0 || galleryStatus.game === game)) return;

	galleryStatus = { list: gallery ?? [], index: 0, game };
	if (galleryInterval)
		clearInterval(galleryInterval);
	updateGallery();
	galleryInterval = galleryStatus.list.length > 1 ? setInterval(updateGallery, INTERVAL_SEC * 1000) : undefined;
}
function updateGallery() {
	const previous = $('#galleryDialog .active');
	$('#galleryDialog .image.passive')
		.removeClass('passive').addClass('active')
		.toggle(galleryStatus.list.length > 0)
		.css('background-image', galleryStatus.list[galleryStatus.index]?.url && `url("${galleryStatus.list[galleryStatus.index]?.url}")`);
	$('#galleryDialog .data.passive')
		.removeClass('passive').addClass('active')
		.find('.game').text(galleryStatus.game).end()
		.find('.title').text(galleryStatus.list[galleryStatus.index]?.title ?? '').end();
	previous.removeClass('active').addClass('passive');
	galleryStatus.index = (galleryStatus.index + 1) % galleryStatus.list.length;
}

$('#galleryDialog .data').draggable({
    drag: event => {
        $('#galleryDialog .data')
            .css('left', $(event.target).css('left'))
            .css('top', $(event.target).css('top'))
            .css('right', 'initial')
            .css('bottom', 'initial');
    },
});

let preprocessGallery = baseUrl => data => data.map(game => {
	const library = Object.fromEntries(game.library.map(entry => [entry.url, { ...entry, url: new URL(entry.url, baseUrl).href }]));
	const lookup = url => {
		if (!library[url]) console.error(`invalid gallery url: ${url}`);
		return library[url];
	};
	return {
		...game,
		screenshots: game.screenshots.map(lookup),
		demoScreenshots: game.demoScreenshots.map(lookup),
		tracks: game.tracks?.map(track => ({ ...track, screenshots: track.screenshots?.map(lookup) })),
	};
});
