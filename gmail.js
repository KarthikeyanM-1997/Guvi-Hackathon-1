var clientId = '76132087808-qg6rjp4saans1ag84cvbrott9395n4oe.apps.googleusercontent.com';
var apiKey = 'AIzaSyALlpwy-5O9vE_zcAoKvPCArV03I-qOTl8';
var scopes = 'https://www.googleapis.com/auth/gmail.readonly' + ' ' + 'https://www.googleapis.com/auth/gmail.send';

function showInbox() {
  if (document.getElementById("inboxContainer").style.display === "none") {
    document.getElementById("inboxContainer").style.display = "block";
    document.getElementById("searchContainer").style.display = "none";
    document.getElementById("composeContainer").style.display = "none";
  }
}

function showSearch() {
  if (document.getElementById("searchContainer").style.display === "none") {
    document.getElementById("searchContainer").style.display = "block"
    document.getElementById("inboxContainer").style.display = "none";
    document.getElementById("composeContainer").style.display = "none";
  }
}

function showCompose() {
  if (document.getElementById("composeContainer").style.display === "none") {
    document.getElementById("composeContainer").style.display = "block"
    document.getElementById("searchContainer").style.display = "none";
    document.getElementById("inboxContainer").style.display = "none";
  }
}

function sendEmail() {
  document.getElementById("send-button").setAttribute("class", "btn btn-primary disabled");
  var textEditor = CKEDITOR.instances["compose-message"];
  //console.log(replyMessageID);
  if (replyMessageID !== 0) {
    sendMessage(
      {
        'To': document.getElementById("compose-to").value,
        'Subject': document.getElementById("compose-subject").value,
        'Content-Type' : 'text/html',
        'In-Reply-To': replyMessageID
      },
      textEditor.getData(),
      composeTidy
    );
    replyMessageID = 0;
  }
  else {
    sendMessage(
      {
        'To': document.getElementById("compose-to").value,
        'Content-Type' : 'text/html',
        'Subject': document.getElementById("compose-subject").value
      },
      textEditor.getData(),
      composeTidy
    );
  }

  return false;
}


function composeTidy() {
  var textEditor = CKEDITOR.instances["compose-message"];
  textEditor.setData("");

  document.getElementById("compose-to").value = "";
  document.getElementById("compose-subject").value = "";
  //document.getElementById("compose-message").value = "";
  
  replyMessageID = 0;
  document.getElementById("send-button").setAttribute("class", "btn btn-primary");
  document.getElementById("compose-subject").value = "";
  document.getElementById("compose-to").disabled = false;
  document.getElementById("compose-subject").disabled = false;
}

function clearReply() {
  var textEditor = CKEDITOR.instances["compose-message"];
  textEditor.setData("");
  
  document.getElementById("compose-to").value = "";
  document.getElementById("compose-subject").value = "";
  //document.getElementById("compose-message").value = "";
  replyMessageID = 0;
  document.getElementById("send-button").setAttribute("class", "btn btn-primary");
  document.getElementById("compose-subject").value = "";
  document.getElementById("compose-to").disabled = false;
  document.getElementById("compose-subject").disabled = false;
}

function sendMessage(headers_obj, message, callback) {
  var email = '';

  for (var header in headers_obj)
    email += header += ": " + headers_obj[header] + "\r\n";

  email += "\r\n" + message;

  var sendRequest = gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': window.btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
    }
  });

  return sendRequest.execute(callback);
}

function handleClientLoad() {
  //console.log("fn:handleClientLoad");
  gapi.client.setApiKey(apiKey);
  window.setTimeout(checkAuth, 1);
}

function checkAuth() {
  //console.log("fn:checkAuth");
  gapi.auth.authorize({
    client_id: clientId,
    scope: scopes,
    immediate: true
  }, handleAuthResult);
}

function handleAuthClick() {
  //console.log("fn:handleAuthClick");
  gapi.auth.authorize({
    client_id: clientId,
    scope: scopes,
    immediate: false
  }, handleAuthResult);
  return false;
}

function handleAuthResult(authResult) {
  //console.log("fn:handleAuthResult");

  if (authResult && !authResult.error) {
    loadGmailApi();
    showInbox();

    document.getElementById("navBar").setAttribute("style", "display:block");

    document.getElementById("authorize-button").setAttribute("class", "btn btn-primary hidden");
    document.getElementById("authorize-button").setAttribute("style", "display:none");
  } else {
    //console.log(authResult);
    document.getElementById("authorize-button").setAttribute("class", "btn btn-primary");
  }
}

function loadGmailApi() {
  //console.log("fn:loadGmailApi");
  gapi.client.load('gmail', 'v1', displayInbox);
}

function refreshInbox() {
  displayInbox();
}
var inboxRow = 1;
function displayInbox() {
  //console.log("fn:displayInbox");
  inboxRow = 1;
  var request = gapi.client.gmail.users.messages.list({
    'userId': 'me',
    'labelIds': 'INBOX',
    'maxResults': 100
  });

  request.execute(function (response) {
    document.getElementById("inboxMessagesDiv").innerHTML = "";
    for (let i = 0; i < response.messages.length; i++) {
      var messageRequest = gapi.client.gmail.users.messages.get({
        'userId': 'me',
        'id': response.messages[i].id
      });

      messageRequest.execute(appendMessageRow);
    }

  });
}

var searchRow = 1;
function displaySearch() {
  //console.log("fn:displaySearch");
  searchRow = 1;
  var request = gapi.client.gmail.users.messages.list({
    'userId': 'me',
    'labelIds': 'INBOX',
    'maxResults': 10,
    'q': document.getElementById("search-field").value
  });

  request.execute(function (response) {

    document.getElementById("searchResultsDiv").innerHTML = "";

    for (let i = 0; i < response.messages.length; i++) {
      var messageRequest = gapi.client.gmail.users.messages.get({
        'userId': 'me',
        'id': response.messages[i].id
      });

      messageRequest.execute(appendSearchRow);
    }

  });
}

function appendMessageRow(message) {
  //console.log("fn:appendMessageRow");

  var inboxContainer = document.getElementById("inboxMessagesDiv");

  var thisRow = document.createElement('div');
  thisRow.setAttribute("class", "row p-3");
  
  if(inboxRow %  2 === 1){
    thisRow.setAttribute("style", "background:#e6e6e6");
  }
  inboxRow++;

  var sender = document.createElement("div");
  sender.setAttribute("class", "col-lg-3");
  sender.innerHTML = getHeader(message.payload.headers, 'From');
  thisRow.appendChild(sender);

  var subject = document.createElement("div");
  subject.setAttribute("class", "col-lg-6");
  subject.innerHTML = '<a href="#message-modal-' + message.id + '" data-toggle="modal" onclick="" id="message-link-' + message.id + '">' + getHeader(message.payload.headers, 'Subject') + '</a>';
  thisRow.appendChild(subject);

  var date = document.createElement("div");
  date.setAttribute("class", "col-lg-3");
  date.innerHTML = getHeader(message.payload.headers, 'Date');
  thisRow.appendChild(date);

  inboxContainer.appendChild(thisRow);

  var modalDiv = document.createElement('div');
  modalDiv.setAttribute("class", "modal fade");
  modalDiv.id = "message-modal-" + message.id;
  modalDiv.setAttribute('tabindex', "-1");
  modalDiv.setAttribute("role", "dialog");

  var reply_to = (getHeader(message.payload.headers, 'Reply-to') !== '' ?
    getHeader(message.payload.headers, 'Reply-to') :
    getHeader(message.payload.headers, 'From')).replace(/\"/g, '&quot;');

  var reply_subject = 'Re: ' + getHeader(message.payload.headers, 'Subject').replace(/\"/g, '&quot;');


  modalDiv.innerHTML = '<div class="modal-dialog modal-lg">\
          <div class="modal-content">\
            <div class="modal-header">\
              <h4 class="modal-title" id="myModalLabel">' +
    getHeader(message.payload.headers, 'Subject') +
    '       <button type="button"\ class="close"\ style="float:right"\
                      data-dismiss="modal"\
                      aria-label="Close">\
                <span aria-hidden="true">&times;</span></button></h4>\
            </div>\
            <div class="modal-body">\
              <iframe id="message-iframe-'+ message.id + '">\
              </iframe>\
            </div>\
            <div class="modal-footer">\
<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\
<button type="button" class="btn btn-primary reply-button" data-dismiss="modal" data-toggle="modal" data-target="#reply-modal"\
onclick="fillInReply(\
  \''+ reply_to + '\', \
  \''+ reply_subject + '\', \
  \''+ getHeader(message.payload.headers, 'Message-ID') + '\'\
  );"\
>Reply</button>\
</div>\
          </div>\
        </div>';

  document.getElementById("mailBody").appendChild(modalDiv);

  document.getElementById('message-link-' + message.id).onclick = function () {
    if (document.getElementById('message-iframe-' + message.id).contentDocument.rendered !== true) {
      document.getElementById('message-iframe-' + message.id).contentDocument.write(getBody(message.payload));
    }
    document.getElementById('message-iframe-' + message.id).contentDocument.rendered = true;
  };
}



function appendSearchRow(message) {
  //console.log("fn:appendSearchRow");

  var inboxContainer = document.getElementById("searchResultsDiv");

  var thisRow = document.createElement('div');
  thisRow.setAttribute("class", "row p-3");

  if(searchRow %  2 === 1){
    thisRow.setAttribute("style", "background:#e6e6e6");
  }
  searchRow++;

  var sender = document.createElement("div");
  sender.setAttribute("class", "col-lg-3");
  sender.innerHTML = getHeader(message.payload.headers, 'From');
  thisRow.appendChild(sender);

  var subject = document.createElement("div");
  subject.setAttribute("class", "col-lg-6");
  subject.innerHTML = '<a href="#search-modal-' + message.id + '" data-toggle="modal" onclick="" id="search-link-' + message.id + '">' + getHeader(message.payload.headers, 'Subject') + '</a>';
  thisRow.appendChild(subject);

  var date = document.createElement("div");
  date.setAttribute("class", "col-lg-3");
  date.innerHTML = getHeader(message.payload.headers, 'Date');
  thisRow.appendChild(date);

  inboxContainer.appendChild(thisRow);

  var modalDiv = document.createElement('div');
  modalDiv.setAttribute("class", "modal fade");
  modalDiv.id = "search-modal-" + message.id;
  modalDiv.setAttribute('tabindex', "-1");
  modalDiv.setAttribute("role", "dialog");

  var reply_to = (getHeader(message.payload.headers, 'Reply-to') !== '' ?
    getHeader(message.payload.headers, 'Reply-to') :
    getHeader(message.payload.headers, 'From')).replace(/\"/g, '&quot;');

  var reply_subject = 'Re: ' + getHeader(message.payload.headers, 'Subject').replace(/\"/g, '&quot;');


  modalDiv.innerHTML = '<div class="modal-dialog modal-lg">\
          <div class="modal-content">\
            <div class="modal-header">\
              <h4 class="modal-title" id="myModalLabel">' +
    getHeader(message.payload.headers, 'Subject') +
    '       <button type="button"\ class="close"\ style="float:right"\
                      data-dismiss="modal"\
                      aria-label="Close">\
                <span aria-hidden="true">&times;</span></button></h4>\
            </div>\
            <div class="modal-body">\
              <iframe id="search-iframe-'+ message.id + '">\
              </iframe>\
            </div>\
            <div class="modal-footer">\
<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\
<button type="button" class="btn btn-primary reply-button" data-dismiss="modal" data-toggle="modal" data-target="#reply-modal"\
onclick="fillInReply(\
  \''+ reply_to + '\', \
  \''+ reply_subject + '\', \
  \''+ getHeader(message.payload.headers, 'Message-ID') + '\'\
  );"\
>Reply</button>\
</div>\
          </div>\
        </div>';

  document.getElementById("mailBody").appendChild(modalDiv);

  document.getElementById('search-link-' + message.id).onclick = function () {
    document.getElementById('search-iframe-' + message.id).contentDocument.write(getBody(message.payload));
  };
}

var replyMessageID = 0;

function fillInReply(to, subject, message_id) {
  document.getElementById("compose-to").value = to;
  document.getElementById("compose-subject").value = subject;
  replyMessageID = message_id;
  document.getElementById("compose-to").disabled = true;
  document.getElementById("compose-subject").disabled = true;
  showCompose();
}




function getHeader(headers, index) {
  var header = '';

  for (let i = 0; i < headers.length; i++) {
    if (headers[i]['name'] === index) {
      header = headers[i]['value'];
      break;
    }
  }

  return header;
}

function getBody(message) {
  var encodedBody = '';
  if (typeof message.parts === 'undefined') {
    encodedBody = message.body.data;
  }
  else {
    encodedBody = getHTMLPart(message.parts);
  }
  encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  return decodeURIComponent(escape(window.atob(encodedBody)));
}

function getHTMLPart(arr) {
  for (var x = 0; x <= arr.length; x++) {
    if (typeof arr[x].parts === 'undefined') {
      if (arr[x].mimeType === 'text/html') {
        return arr[x].body.data;
      }
    }
    else {
      return getHTMLPart(arr[x].parts);
    }
  }
  return '';
}

CKEDITOR.replace('compose-message', {
  height: 250
});