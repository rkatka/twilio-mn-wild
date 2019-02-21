const express = require('express');
const https = require('https');
const config = require('./config');
const client = require('twilio')(config.accountSid, config.authToken);

const app = express();
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

// request to statsapi for the Minnesota Wild
const req = https.request('https://statsapi.web.nhl.com/api/v1/teams/30?expand=team.schedule.previous', (res) => {
  res.on('data', (d) => {
    const data = JSON.parse(d);
    const teamData = data.teams[0].previousGameSchedule.dates[0].games[0].teams;
    
    let homeTeam = teamData.home.team.id === 30 ? teamData.home : teamData.away;
    let competitor = teamData.home.team.id === 30 ? teamData.away : teamData.home;
    let verb;
    let msgBody;

    if( homeTeam.score > competitor.score ) {
      // win
      verb = 'yes';
    } else if ( homeTeam.score === competitor.score ) {
      // tie game
      verb = 'tie';
    } else {
      // lost
      verb = 'no';
    }

    msgBody = verb.toUpperCase() + ' ' + homeTeam.score + '-' + competitor.score + ' against the ' + competitor.team.name

    sendData(msgBody);
  });
});

req.on('error', (e)=> {
  console.error(e.message);
});

req.end();

function sendData(data) {
  client.messages
    .create({
      body: 'Did the Minnesota Wild win?\n' + data,
      from: config.from,
      to: config.to
    })
    .then(message=> console.log(message.sid))
    .done();
}