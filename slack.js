var https = require('https');
var url = require('url');
var slackHookRequestOptions = getSlackHookRequestOptions();
module.exports.sendToSlack = sendToSlack;

function getSlackHookRequestOptions() {
    var hookUri = url.parse(process.env.slackhookuri);

    return {
        host: hookUri.hostname,
        port: hookUri.port,
        path: hookUri.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
}

function sendToSlack(parsedRequest, callback) {
    if (!parsedRequest || (parsedRequest.body || '').trim() === '') {
        callback(true);
        return;
    }

    var error = false;
    var slackMessage = convertToSlackMessage(parsedRequest.body, parsedRequest.channel, parsedRequest.type);
    var req = https.request(slackHookRequestOptions);

    req.on('error', function(e) {
        console.error(e);
        error = true;
    });

    req.on('close', function() {
        callback(error);
    });

    req.write(slackMessage);
    req.end();
}

function convertToSlackMessage(body, channel, type) {
    var parsedBody = trParseBody(body);

    return JSON.stringify({
        username: 'Bitbucket Issues',
        icon_emoji: ':ledger:',
        text: getParsedTitle(parsedBody, type) +
            " created by " + getParsedUsername(parsedBody, type) +
            " with " + getParsedPriority(parsedBody, type) +
            " priority. <" + getParsedLink(parsedBody, type) + "|Details>",
        channel: channel || process.env.slackchannel
    });
}

function trParseBody(body) {
    try {
        return JSON.parse(body) || {
            status: 'failed',
            complete: false
        };
    } catch (err) {
        console.error(err);
        return {
            status: err,
            complete: false
        };
    }
}

function getParsedUsername(parsedBody, type) {
    return (
        parsedBody.issue.reporter.username !== '' ? parsedBody.issue.reporter.username : 'Username is missing'
    );
}

function getParsedTitle(parsedBody, type) {
    return (
        parsedBody.issue.title !== '' ? parsedBody.issue.title : 'Unknown issue title'
    );
}

function getParsedLink(parsedBody, type) {
    return (
        parsedBody.issue.links.html.href !== '' ? parsedBody.issue.links.html.href : ''
    );
}

function getParsedPriority(parsedBody, type) {
    return (
        parsedBody.issue.priority !== '' ? parsedBody.issue.priority : 'unknown'
    );
}