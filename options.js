var inbox = document.getElementById('inbox');
var staff = document.getElementById('staff');
var torrents = document.getElementById('torrents');
var save = document.getElementById('save');

var enableSave = function() {
  save.textContent = 'Save';
  save.disabled = false;
};

var disableSave = function() {
  save.textContent = 'Saved';
  save.disabled = true;
};

var restoreOptions = function() {
  chrome.storage.sync.get({
    syncInbox: true,
    syncStaff: true,
    syncTorrents: true,
  }, function(data) {
    inbox.checked = data.syncInbox;
    staff.checked = data.syncStaff;
    torrents.checked = data.syncTorrents;
    inbox.disabled = false;
    staff.disabled = false;
    torrents.disabled = false;
  });
};

var saveOptions = function() {
chrome.storage.sync.set({
    syncInbox: inbox.checked,
    syncStaff: staff.checked,
    syncTorrents: torrents.checked,
  }, disableSave);
};

inbox.onchange = enableSave;
staff.onchange = enableSave;
torrents.onchange = enableSave;

document.addEventListener('DOMContentLoaded', restoreOptions);
save.addEventListener('click', saveOptions);
