'use strict';

import { showDialog } from './utils.js';

$('#backgroundDialog').dialog({
  width: 400,
  height: 300,
  position: { my: "left", at: "left+8% center", of: window },
  open: function() {
    $(this).parent().focus();
  },
});

export function show() {
  showDialog($('#backgroundDialog'));
}

const backgrounds = [
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/another-flowing-blue-abstract-texture-445x312.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/dark-blue-swirl-abstract-texture-background/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/another-flowing-blue-abstract-texture.jpg', name: 'Dark blue swirl abstract texture background' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/Deep-Blue-Abstract-Background-445x290.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/deep-dark-blue-abstract-background-image/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/Deep-Blue-Abstract-Background.jpg', name: 'Deep dark blue abstract background image' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/06/abstract4-445x356.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/large-abstract-illustration-swirling-underwater-colours/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/06/abstract4.jpg', name: 'a large abstract illustration of swirling underwater colours' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/06/blocks-900x900.jpg?ezimgfmt=ng%3Awebp%2Fngcb1%2Frs%3Adevice%2Frscb1-1', refUrl: 'https://www.myfreetextures.com/abstract-block-concrete-rendered-background-texture/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/06/blocks.jpg', name: 'abstract block concrete rendered background texture' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/bokeh4-445x349.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/bright-yellow-bokeh-circles-background-image/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/bokeh4.jpg', name: 'Bright yellow bokeh circles background image' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/bokeh1-445x388.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/great-blue-and-purple-bokeh-circles-background/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/bokeh1.jpg', name: 'great blue and purple bokeh circles background' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/tiger-fur-texture-445x445.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/seamless-orange-tiger-fur-texture/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/tiger-fur-texture.jpg', name: 'seamless orange tiger fur' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/06/another-rough-old-and-worn-parchment-paper-445x366.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/worn-parchment-paper-2/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/06/another-rough-old-and-worn-parchment-paper.jpg', name: 'an old and worn out parchment paper' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/burlgrunge-445x312.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/abstract-grunge-background-texture-in-brown-and-red/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/burlgrunge.jpg', name: 'Abstract Grunge Background Texture' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/burlwood2-445x445.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/abstract-texture-grunge-background-in-red-and-yellow/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/burlwood2.jpg', name: 'Abstract texture grunge background in red and yellow' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/seamless-wicker-basket-texture-445x445.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/another-seamless-wicker-basket-texture/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/seamless-wicker-basket-texture.jpg', name: 'Another seamless wicker basket' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/seamless-wood-texture-1-445x445.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/a-dark-and-deep-seamless-wood-texture/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/seamless-wood-texture-1.jpg', name: 'A dark and deep seamless wood texture' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/thatch1-445x445.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/seamless-background-image-of-woven-thatch-straw-roof/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/thatch1.jpg', name: 'seamless background image of woven thatch straw roof' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/seamless-wood-planks-3-445x445.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/wooden-background-seamless-wood-floor/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/seamless-wood-planks-3.jpg', name: 'wooden background seamless wood floor' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/earth2-445x393.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/illustration-of-hot-dry-and-cracked-ground-or-lake-bed/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/earth2.jpg', name: 'illustration of hot, dry and cracked ground or lake bed' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2012/05/2011-06-11-09616-445x376.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/tree-stump-cut-wood-texture/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2012/05/2011-06-11-09616.jpg', name: 'old cracked tree stump cut wood texture' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/abstract-blue-grunge-texture-445x446.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/deep-blue-abstract-grunge-texture/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/abstract-blue-grunge-texture.jpg', name: 'deep blue abstract grunge texture' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/underwater-blue-abstract-texture-445x297.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/another-large-blue-under-water-scene-full-of-bubbles/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/underwater-blue-abstract-texture.jpg', name: 'Another large blue under water scene full of bubbles' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/blue-ocean-waves-445x264.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/blue-background-photo-of-some-ocean-waves/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/11/blue-ocean-waves.jpg', name: 'Blue background photo of some ocean waves' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2021/10/Sea-Ripple-Texture-Free-Stock-Photo--445x297.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/sea-ripple-texture-free-stock-photo/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2021/10/Sea-Ripple-Texture-Free-Stock-Photo-.jpg', name: 'Sea Ripple Texture' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/IGP5325-445x290.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/blue-sky-and-blue-water-background-free-stock-photo-of-the-beach-in-the-morning/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2014/10/IGP5325.jpg', name: 'Blue sky and blue water background' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/05/2008-07-11_IMGP7353-445x308.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/seashells-background-image/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/05/2008-07-11_IMGP7353.jpg', name: 'Seashells background image' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/05/2007-12-09__IGP9162-445x310.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/free-green-palm-leaf-closeup-photo-background-texture/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2011/05/2007-12-09__IGP9162.jpg', name: 'Free green palm leaf closeup photo background texture' },
  { previewUrl: 'https://www.myfreetextures.com/wp-content/uploads/2021/10/green-leaves-texture-background-dark-1200px-445x297.jpg?ezimgfmt=ng:webp/ngcb1', refUrl: 'https://www.myfreetextures.com/green-leaves-texture-background-dark/', fileUrl: 'https://www.myfreetextures.com/wp-content/uploads/2021/10/green-leaves-texture-background-dark.jpg', name: 'Green Leaves Texture Background Dark' },
];

$('#backgrounds').append(
  backgrounds.map(bg =>
    $('<a>', { class: 'block', href: bg.fileUrl, 'data-name': bg.name, 'data-ref-url': bg.refUrl })
      .append($('<img>', { src: bg.previewUrl }))
  )
);
$('#backgroundDialog .cover input').checkboxradio({
  icon: false,
});
$('#backgroundDialog .contain input').checkboxradio({
  icon: false,
});

function setBackground(data) {
  $('body').css('background-image', data == null ? '' : `url(${data.url})`);
  $('#backgroundDialog .name a').attr('href', data == null ? '-' : data.refUrl);
  $('#backgroundDialog .name a').text(data == null ? '-' : data.name);
  $('#backgroundDialog .name').toggle(data !== null);
  $('#backgroundDialog .reset').toggle(data !== null);
}
$('#backgrounds').on('click', 'a', event => {
  setBackground({
    url: event.currentTarget.href,
    name: event.currentTarget.attributes['data-name'].value,
    refUrl: event.currentTarget.attributes['data-ref-url'].value,
  });
  event.preventDefault();
});
$('#backgroundDialog .reset').on('click', () => {
  setBackground(null);
});
setBackground(null);

function setSize(size) {
  $('#backgroundDialog input[type=checkbox]').prop('checked', false).checkboxradio('refresh');
  $(`#backgroundDialog input[type=checkbox][name=${size}]`).prop('checked', true).checkboxradio('refresh');
  $('body').css('background-size', size);
}
$('#backgroundDialog .cover input').on('click', () => {
  setSize('cover');
});
$('#backgroundDialog .contain input').on('click', () => {
  setSize('contain');
});
setSize('cover');
