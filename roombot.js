var Botkit = require('./lib/Botkit.js');

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var controller = Botkit.slackbot({
  debug: true,
});

var messageText = 'Something went wrong...';

// connect the bot to a stream of messages
controller.spawn({
  token: "xoxb-27634090961-iYANILU955DHJc0Cwc0B3gnf",
}).startRTM()

// let's introduce ourselves
controller.on(['bot_channel_join','bot_group_join'],function(bot,message) {

  bot.reply(message,'Thanks for having me!');

});

// give the bot something to listen for.
controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {

  bot.reply(message,'Hello yourself.');

});

controller.hears('my next meeting',['direct_message','direct_mention','mention'],function(bot,message) {

	// Load client secrets from a local file.
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
	  if (err) {
	    console.log('Error loading client secret file: ' + err);
	    return;
	  }
	  // Authorize a client with the loaded credentials, then call the
	  // Google Calendar API.
	  authorize(JSON.parse(content), nextEvent);

	  setTimeout(function(){ bot.reply(message,messageText) }, 1000);

	});

});

function nextEvent(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      messageText = 'The API returned an error: ' + err;
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      messageText = 'I do not see any upcoming events.';
      return;
    } else {
      var event = events[0];
      var start = event.start.dateTime || event.start.date;
      messageText = 'Your next meeting is ' + event.summary + ' at ' + start + '.';
      return;
    }
  });
}


/**
 *
 * Google Calendar Example
 * 
 */

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
