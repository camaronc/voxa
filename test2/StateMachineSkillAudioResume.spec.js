/**
 * State Machine Skill Tests
 *
 * Copyright (c) 2016 Rain Agency.
 * Licensed under the MIT license.
 */

'use strict';

const expect = require('chai').expect;
const alexa = require('../');
const responses = require('./responses');
const variables = require('./variables');
const _ = require('lodash');
const Model = require('./model');

const appId = 'some-app-id';
const TEST_URLS = [
  'https://s3.amazonaws.com/alexa-voice-service/welcome_message.mp3',
  'https://s3.amazonaws.com/alexa-voice-service/bad_response.mp3',
  'https://s3.amazonaws.com/alexa-voice-service/goodbye_response.mp3',
];

const states = {
  entry: {
    to: {
      LaunchIntent: 'launch',
      'AMAZON.ResumeIntent': 'resume',
      'AMAZON.StopIntent': 'exit',
      'AMAZON.CancelIntent': 'exit',
    },
  },
  resume: {
    enter: function enter(request) {
      let index = 0;
      let shuffle = 0;
      let loop = 0;
      let offsetInMilliseconds = 0;

      if (request.context && request.context.AudioPlayer) {
        const token = JSON.parse(request.context.AudioPlayer.token);
        index = token.index;
        shuffle = token.shuffle;
        loop = token.loop;
        offsetInMilliseconds = request.context.AudioPlayer.offsetInMilliseconds;
      }

      const directives = {};
      directives.type = 'AudioPlayer.Play';
      directives.playBehavior = 'REPLACE_ALL';
      directives.token = createToken(index, shuffle, loop);
      directives.url = TEST_URLS[index];
      directives.offsetInMilliseconds = offsetInMilliseconds;

      return alexa.replyWithAudioDirectives('LaunchIntent.OpenResponse', 'die', request,
        null, directives);
    },
  },
  exit: {
    enter: function enter(request) {
      return alexa.replyWith('ExitIntent.Farewell', 'die', request);
    },
  },
  die: { isTerminal: true },
  launch: {
    enter: function enter(request) {
      return alexa.replyWith('LaunchIntent.OpenResponse', 'die', request);
    },
  },
};

function createToken(index, shuffle, loop) {
  const token = {};
  token.index = index;
  token.shuffle = shuffle;
  token.loop = loop;

  return JSON.stringify(token);
}

const skill = new alexa.StateMachineSkill(appId, { responses, variables, Model });
_.map(states, (state, name) => {
  skill.onState(name, state);
});

describe('StateMachineSkill', () => {
  itIs('audioResume', (res) => {
    expect(res.response.outputSpeech.ssml).to.include('Hello! Good');

    const token = JSON.parse(res.response.directives[0].audioItem.stream.token);
    expect(token.index).to.equal(1, 'AUDIO INDEX 1');
    expect(token.shuffle).to.equal(1, 'SHUFFLE OFF');
    expect(token.loop).to.equal(0, 'LOOP OFF');
    expect(res.response.directives[0].audioItem.stream.offsetInMilliseconds).to.equal(
      353160, 'OFFSETINMILLISECONDS OK');
  });

  function itIs(requestFile, cb) {
    it(requestFile, (done) => {
      const event = require(`./requests/${requestFile}.js`);
      event.context.System.application.applicationId = appId;
      skill.execute(event, {
        succeed(response) {
          try {
            cb(response);
          } catch (e) {
            return done(e);
          }

          return done();
        },

        fail: done,
      });
    });
  }
});
