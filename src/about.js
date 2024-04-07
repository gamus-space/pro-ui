'use strict';

import { dialogOptions, initDialog, showDialog } from './utils.js';

$('#aboutDialog').dialog({
  ...dialogOptions,
  position: { my: "center", at: "center", of: window },
  resizable: false,
  open: function() {
    $(this).parent().focus();
  },
});
initDialog($('#aboutDialog'), { icon: 'ph:info' });

export function show() {
  showDialog($('#aboutDialog'));
}
