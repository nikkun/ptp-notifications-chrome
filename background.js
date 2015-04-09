/**
 * Copyright 2015.
 * DO NOT DISTRIBUTE
 * Just kidding, do whatever the fuck you want
 *
 * Problems, suggestions?
 * https://github.com/nikkun/ptp-notifications-chrome
 * PTP: nikkun
 * Email: nikkun01@gmail.com
 *
 * Credit to heirun3 for inspiration:
 * https://tls.passthepopcorn.me/forums.php?action=viewthread&threadid=24280
 */

// PTP message class
var Message = function(type, id, from, subject, href, tag) {
  this.type = type;
  this.id = id;
  this.from = from;
  this.subject = subject;
  this.href = href;
  this.tag = tag;
};

// The key that the notification is stored under in localStorage
Message.prototype.localStorageKey = function() {
  return 'ptp_' + this.type + '_' + this.id;
};

// Tells whether the message with this id has already been sent
// Doesn't apply to torrent notifications
Message.prototype.hasNotified = function() {
  if (this.type != 'torrent') {
    return localStorage[this.localStorageKey()] !== undefined;
  } else {
    return false;
  };
};

// Store the fact that this message has ben sent
Message.prototype.save = function() {
  if (this.type != 'torrent') {
    localStorage[this.localStorageKey()] = true;
  };
};

// Send the actual notification, and add a click callback
Message.prototype.notify = function() {
  if (this.hasNotified()) {
    return;
  };
  // Don't send again
  this.save();

  // Send the notification
  var note = new Notification(this.from, {
    body: this.subject,
    icon: 'icons/icon160.png',
    tag: this.tag,
  });

  // Open message when notification is clicked
  var url = this.href;
  note.onclick = function() {
    var link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.click();
  };
};

// Spit out an error message to the console
var error = function(details) {
  var msg = 'Could not fetch PTP inbox';
  if (details !== undefined) {
    msg += ': ' + details;
  };
  console.error(msg);
};

// Make a GET HTTP request to url, and pass onload as a callback
// If the request fails, or returns a non-200 status, error is called
var request = function(url, onload) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onload = function() {
    if (this.status == 200) {
      onload(this.response);
    } else {
      error('Invalid status code (' + this.status + ')');
    };
  };
  xhr.onabort = error;
  xhr.onerror = error;
  xhr.responseType = 'document';
  xhr.send();
};

// Parse inbox page
var parseInbox = function(response) {
  var messageRows = response.getElementsByClassName('inbox-message--unread');
  for (var i = 0; i < messageRows.length; i++) {
    var cells =  messageRows[i].getElementsByTagName('td');
    var link = cells[1].getElementsByTagName('a')[0];
    var id = cells[0].getElementsByTagName('input')[0].value;
    var href = link.href;
    var subject = link.textContent;
    var from = cells[2].textContent;
    var message = new Message('inbox', id, from, subject, href);
    message.notify();
  };
};

// Check staff inbox page
var checkStaffInbox = function() {
  request('https://tls.passthepopcorn.me/staffpm.php', function(response) {
    var messageRows = response.getElementsByClassName('inbox-message--unread');
    for (var i = 0; i < messageRows.length; i++) {
      var cells =  messageRows[i].getElementsByTagName('td');
      var link = cells[1].getElementsByTagName('a')[0];
      var id = cells[0].getElementsByTagName('input')[0].value;
      var href = link.href;
      var subject = link.textContent;
      var from = 'Staff PM';
      var message = new Message('staff', id, from, subject, href);
      message.notify();
    };
  });
};

// This one gets a little fancy. We decide which pages to scrape other than
//   the inbox page based on the message notifications present on all pages. If
//   a message box says we have a staff pm or torrent notification, scrape them
var main = function() {
  chrome.storage.sync.get({
    syncInbox: true,
    syncStaff: true,
    syncTorrents: true,
  }, function(prefs) {
    request('https://tls.passthepopcorn.me/inbox.php', function(response) {
      if (prefs.syncInbox) {
        parseInbox(response);
      };
      var alerts = response.getElementsByClassName('alert-bar__link');
      for (var i = 0; i < alerts.length; i++) {
        if (prefs.syncStaff && alerts[i].href.indexOf('staffpm.php') !== -1) {
          checkStaffInbox();
        } else if (prefs.syncTorrents
            && alerts[i].href.indexOf('torrents.php?action=notify') !== -1) {
          var numTorrents = alerts[i].textContent;
          var message = new Message(
            'torrent',
            null,
            'New torrent notifications',
            alerts[i].textContent,
            alerts[i].href,
            'newTorrent');
          message.notify();
        };
      };
    });
  });
};

// Run it!
main();

// Repeat every 10 minutes
setInterval(main, 1000 * 60 * 10);
