import "mocha";

import { canfulfill, RequestEnvelope } from "ask-sdk-model";
import { expect } from "chai";
import * as _ from "lodash";
import * as simple from "simple-mock";

import {
  AlexaEvent,
  AlexaPlatform,
  AlexaReply,
  IVoxaEvent,
  Model,
  VoxaApp,
} from "../src";
import { AlexaRequestBuilder } from "./tools";
import { variables } from "./variables";
import { views } from "./views";

import { PlayAudio } from "../src/platforms/alexa/directives";

const rb = new AlexaRequestBuilder();

describe("VoxaApp", () => {
  let statesDefinition: any;
  let event: RequestEnvelope;

  beforeEach(() => {
    event = rb.getIntentRequest("SomeIntent");
    simple.mock(AlexaPlatform, "apiRequest").resolveWith(true);

    statesDefinition = {
      DisplayElementSelected: { tell: "ExitIntent.Farewell", to: "die" },
      entry: () => ({ tell: "ExitIntent.Farewell", to: "die" }),
      initState: { to: "endState" },
      secondState: { to: "initState" },
      thirdState: () => Promise.resolve({ to: "endState" }),
    };
  });

  describe("serializeModel", () => {
    it("should throw an InvalidTransitionError if the transition doesn't have a `to` key", async () => {
      const voxaApp = new VoxaApp({ variables, views });
      const voxaEvent = new AlexaEvent(rb.getIntentRequest("LaunchIntent"));
      const voxaReply = new AlexaReply();
      const transition = {};
      try {
        await voxaApp.saveSession(voxaEvent, voxaReply, transition);
        throw new Error("Should have failed with InvalidTransitionError");
      } catch (error) {
        expect(error.message).to.equal(
          "Transition was not valid Missing transition.to. {}",
        );
      }
    });
  });

  describe("entry", () => {
    it("should do multiple transitions inside a single entry state", async () => {
      const voxaApp = new VoxaApp({ variables, views });
      const launchEvent = new AlexaEvent(rb.getIntentRequest("LaunchIntent"));
      voxaApp.onState("entry", {
        Exit: { tell: "ExitIntent.Farewell" },
        LaunchIntent: "One",
        One: "Two",
        Three: "Exit",
        Two: "Three",
      });

      const reply = await voxaApp.execute(launchEvent, new AlexaReply());
      // expect(reply.error).to.be.undefined;
      expect(reply.speech).to.deep.equal(
        "<speak>Ok. For more info visit example.com site.</speak>",
      );
    });
  });

  describe("onState", () => {
    it("should accept new states", () => {
      const voxaApp = new VoxaApp({ variables, views });
      const fourthState = () => ({ to: "endState" });
      voxaApp.onState("fourthState", fourthState);
      expect(voxaApp.states.core.fourthState.enter.entry).to.equal(fourthState);
    });

    it("should register simple states", () => {
      const voxaApp = new VoxaApp({ variables, views });
      const stateFn = simple.stub();
      voxaApp.onState("init", stateFn);

      expect(voxaApp.states.core.init).to.deep.equal({
        enter: {
          entry: stateFn,
        },
        name: "init",
      });
    });

    it("should register states for specific intents", () => {
      const voxaApp = new VoxaApp({ variables, views });
      const stateFn = simple.stub();
      voxaApp.onState("init", stateFn, "AMAZON.NoIntent");

      expect(voxaApp.states.core.init).to.deep.equal({
        enter: { "AMAZON.NoIntent": stateFn },
        name: "init",
      });
    });

    it("should register states for intent lists", () => {
      const voxaApp = new VoxaApp({ variables, views });
      const stateFn = simple.stub();
      const stateFn2 = simple.stub();

      voxaApp.onState("init", stateFn, [
        "AMAZON.NoIntent",
        "AMAZON.StopIntent",
      ]);
      voxaApp.onState("init", stateFn2, "AMAZON.YesIntent");

      expect(voxaApp.states.core.init).to.deep.equal({
        enter: {
          "AMAZON.NoIntent": stateFn,
          "AMAZON.StopIntent": stateFn,
          "AMAZON.YesIntent": stateFn2,
        },
        name: "init",
      });
    });
  });

  it("should include the state in the session attributes", async () => {
    const voxaApp = new VoxaApp({ variables, views });
    voxaApp.onIntent("LaunchIntent", () => {
      return { to: "secondState", sayp: "This is my message", flow: "yield" };
    });

    voxaApp.onState("secondState", () => ({}));

    const launchEvent = new AlexaEvent(rb.getIntentRequest("LaunchIntent"));
    const reply = (await voxaApp.execute(
      launchEvent,
      new AlexaReply(),
    )) as AlexaReply;
    expect(reply.sessionAttributes.state).to.equal("secondState");
    expect(reply.response.shouldEndSession).to.be.false;
  });

  it("should include outputAttributes in the session attributes", async () => {
    const voxaApp = new VoxaApp({ variables, views });
    voxaApp.onIntent("LaunchIntent", (request) => {
      request.session.outputAttributes.foo = "bar";
      return { to: "secondState", sayp: "This is my message", flow: "yield" };
    });
    voxaApp.onState("secondState", () => ({}));

    const launchEvent = new AlexaEvent(rb.getIntentRequest("LaunchIntent"));
    const reply = (await voxaApp.execute(
      launchEvent,
      new AlexaReply(),
    )) as AlexaReply;
    expect(reply.sessionAttributes.foo).to.equal("bar");
  });

  it("should add the message key from the transition to the reply", async () => {
    const voxaApp = new VoxaApp({ variables, views });
    voxaApp.onIntent("LaunchIntent", () => ({ sayp: "This is my message" }));
    const launchEvent = new AlexaEvent(rb.getIntentRequest("LaunchIntent"));

    const reply = (await voxaApp.execute(
      launchEvent,
      new AlexaReply(),
    )) as AlexaReply;
    expect(reply.speech).to.deep.equal("<speak>This is my message</speak>");
  });

  it("should throw an error if trying to render a missing view", async () => {
    const voxaApp = new VoxaApp({ variables, views });
    voxaApp.onIntent("LaunchIntent", () => ({ ask: "Missing.View" }));
    const launchEvent = new AlexaEvent(rb.getIntentRequest("LaunchIntent"));

    const reply = (await voxaApp.execute(
      launchEvent,
      new AlexaReply(),
    )) as AlexaReply;
    // expect(reply.error).to.be.an("error");
    expect(reply.speech).to.equal(
      "<speak>An unrecoverable error occurred.</speak>",
    );
  });

  it("should allow multiple reply paths in reply key", async () => {
    const voxaApp = new VoxaApp({ variables, views });
    voxaApp.onIntent("LaunchIntent", (voxaEvent) => {
      voxaEvent.model.count = 0;
      return { say: ["Count.Say", "Count.Tell"] };
    });
    const launchEvent = new AlexaEvent(rb.getIntentRequest("LaunchIntent"));

    const reply = (await voxaApp.execute(
      launchEvent,
      new AlexaReply(),
    )) as AlexaReply;
    expect(reply.speech).to.deep.equal("<speak>0\n0</speak>");
  });

  it("should display element selected request", async () => {
    const voxaApp = new VoxaApp({ variables, views });
    const alexaEvent = rb.getDisplayElementSelectedRequest("token");
    voxaApp.onIntent("Display.ElementSelected", {
      tell: "ExitIntent.Farewell",
      to: "die",
    });

    const alexaSkill = new AlexaPlatform(voxaApp);
    const reply = await alexaSkill.execute(alexaEvent, {});
    expect(_.get(reply, "response.outputSpeech.ssml")).to.equal(
      "<speak>Ok. For more info visit example.com site.</speak>",
    );
  });

  it("should be able to just pass through some intents to states", async () => {
    const voxaApp = new VoxaApp({ variables, views });
    let called = false;
    voxaApp.onIntent("LoopOffIntent", () => {
      called = true;
      return { tell: "ExitIntent.Farewell", to: "die" };
    });

    const alexa = new AlexaPlatform(voxaApp);
    const loopOffEvent = rb.getIntentRequest("AMAZON.LoopOffIntent");

    await alexa.execute(loopOffEvent, AlexaReply);
    expect(called).to.be.true;
  });

  it("should accept onBeforeStateChanged callbacks", () => {
    const voxaApp = new VoxaApp({ variables, views });
    voxaApp.onBeforeStateChanged(simple.stub());
  });

  it("should call the entry state on a new session", async () => {
    statesDefinition.entry = simple.stub().resolveWith({
      say: "ExitIntent.Farewell",
    });

    const voxaApp = new VoxaApp({ variables, views });
    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );

    await voxaApp.execute(new AlexaEvent(event), new AlexaReply());
    expect(statesDefinition.entry.called).to.be.true;
  });

  it("should set properties on request and have those available in the state callbacks", async () => {
    const voxaApp = new VoxaApp({ views, variables });
    statesDefinition.entry = simple.spy((request) => {
      expect(request.model).to.not.be.undefined;
      expect(request.model).to.be.an.instanceOf(Model);

      return { tell: "ExitIntent.Farewell", to: "die" };
    });

    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );
    await voxaApp.execute(new AlexaEvent(event), new AlexaReply());
    expect(statesDefinition.entry.called).to.be.true;
    expect(statesDefinition.entry.lastCall.threw).to.be.not.ok;
  });

  // it("should simply set an empty session if serialize is missing", async () => {
  // const voxaApp = new VoxaApp({ views, variables });
  // statesDefinition.entry = simple.spy((request) => {
  // request.model = null;
  // return { ask: "Ask", to: "initState" };
  // });
  // _.map(statesDefinition, (state: any, name: string) => voxaApp.onState(name, state));
  // const reply = await voxaApp.execute(event, new AlexaReply()) as AlexaReply;
  // // expect(reply.error).to.be.undefined;
  // expect(statesDefinition.entry.called).to.be.true;
  // expect(statesDefinition.entry.lastCall.threw).to.be.not.ok;
  // expect(reply.sessionAttributes).to.deep.equal(new Model({ state: "initState" }));
  // });

  it("should allow async serialization in Model", async () => {
    class PromisyModel extends Model {
      public serialize() {
        // eslint-disable-line class-methods-use-this
        return Promise.resolve({
          value: 1,
        });
      }
    }

    const voxaApp = new VoxaApp({ views, variables, Model: PromisyModel });
    statesDefinition.entry = simple.spy((request) => {
      expect(request.model).to.not.be.undefined;
      expect(request.model).to.be.an.instanceOf(PromisyModel);
      return { ask: "Ask", to: "initState" };
    });

    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );
    const platform = new AlexaPlatform(voxaApp);
    const reply = (await platform.execute(event, {})) as AlexaReply;
    expect(statesDefinition.entry.called).to.be.true;
    expect(statesDefinition.entry.lastCall.threw).to.be.not.ok;
    expect(reply.sessionAttributes).to.deep.equal({
      model: { value: 1 },
      state: "initState",
    });
  });

  it("should let model.deserialize return a Promise", async () => {
    class PromisyModel extends Model {
      public static async deserialize(data: any) {
        const model = new PromisyModel();
        model.didDeserialize = "yep";
        return model;
      }
    }

    const voxaApp = new VoxaApp({ views, variables, Model: PromisyModel });
    statesDefinition.entry = simple.spy((request) => {
      expect(request.model).to.not.be.undefined;
      expect(request.model).to.be.an.instanceOf(PromisyModel);
      expect(request.model.didDeserialize).to.eql("yep");
      return { say: "ExitIntent.Farewell", to: "die" };
    });

    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );

    const sessionEvent = rb.getIntentRequest("SomeIntent");
    _.set(sessionEvent, "session.attributes", { model: { foo: "bar" } });

    await voxaApp.execute(new AlexaEvent(sessionEvent), new AlexaReply());
    expect(statesDefinition.entry.called).to.be.true;
    expect(statesDefinition.entry.lastCall.threw).to.be.not.ok;
  });

  it("should call onSessionEnded callbacks if state is die", async () => {
    const voxaApp = new VoxaApp({ Model, views, variables });
    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );
    const onSessionEnded = simple.stub();
    voxaApp.onSessionEnded(onSessionEnded);

    await voxaApp.execute(new AlexaEvent(event), new AlexaReply());
    expect(onSessionEnded.called).to.be.true;
  });

  it("should call onBeforeReplySent callbacks", async () => {
    const voxaApp = new VoxaApp({ Model, views, variables });
    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );
    const onBeforeReplySent = simple.stub();
    voxaApp.onBeforeReplySent(onBeforeReplySent);

    await voxaApp.execute(new AlexaEvent(event), new AlexaReply());
    expect(onBeforeReplySent.called).to.be.true;
  });

  it("should call entry on a LaunchRequest", async () => {
    const voxaApp = new VoxaApp({ Model, views, variables });
    const launchEvent = rb.getIntentRequest("LaunchIntent");
    statesDefinition.entry = simple.stub().resolveWith({
      to: "die",
    });

    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );
    await voxaApp.execute(new AlexaEvent(launchEvent), new AlexaReply());
    expect(statesDefinition.entry.called).to.be.true;
  });

  it("should fulfill request", async () => {
    const canFulfillIntent: canfulfill.CanFulfillIntent = {
      canFulfill: "YES",
      slots: {
        slot1: {
          canFulfill: "YES",
          canUnderstand: "YES",
        },
      },
    };

    const voxaApp = new VoxaApp({ views, variables });
    const alexaSkill = new AlexaPlatform(voxaApp);
    voxaApp.onCanFulfillIntentRequest(
      (alexaEvent: AlexaEvent, alexaReply: AlexaReply) => {
        alexaReply.fulfillIntent("YES");
        alexaReply.fulfillSlot("slot1", "YES", "YES");
        return alexaReply;
      },
    );

    event = rb.getCanFulfillIntentRequestRequest("NameIntent", {
      slot1: "something",
    });
    const reply = (await alexaSkill.execute(
      event,
      new AlexaReply(),
    )) as AlexaReply;

    expect(reply.response.card).to.be.undefined;
    expect(reply.response.reprompt).to.be.undefined;
    expect(reply.response.outputSpeech).to.be.undefined;
    expect(reply.response.canFulfillIntent).to.deep.equal(canFulfillIntent);
  });

  it("should fulfill request with default intents", async () => {
    const canFulfillIntent = {
      canFulfill: "YES",
      slots: {
        slot1: {
          canFulfill: "YES",
          canUnderstand: "YES",
        },
      },
    };

    const defaultFulfillIntents = ["NameIntent"];
    const voxaApp = new VoxaApp({ views, variables });
    const alexaSkill = new AlexaPlatform(voxaApp, { defaultFulfillIntents });

    event = rb.getCanFulfillIntentRequestRequest("NameIntent", {
      slot1: "something",
    });
    const reply = (await alexaSkill.execute(
      event,
      new AlexaReply(),
    )) as AlexaReply;

    expect(reply.response.card).to.be.undefined;
    expect(reply.response.reprompt).to.be.undefined;
    expect(reply.response.outputSpeech).to.be.undefined;
    expect(reply.response.canFulfillIntent).to.deep.equal(canFulfillIntent);
  });

  it("should return MAYBE fulfill response to CanFulfillIntentRequest", async () => {
    const canFulfillIntent: canfulfill.CanFulfillIntent = {
      canFulfill: "MAYBE",
      slots: {
        slot1: {
          canFulfill: "YES",
          canUnderstand: "YES",
        },
      },
    };

    const voxaApp = new VoxaApp({ views, variables });
    const alexaSkill = new AlexaPlatform(voxaApp);
    voxaApp.onCanFulfillIntentRequest(
      (alexaEvent: AlexaEvent, alexaReply: AlexaReply) => {
        alexaReply.fulfillIntent("MAYBE");
        alexaReply.fulfillSlot("slot1", "YES", "YES");
        return alexaReply;
      },
    );

    event = rb.getCanFulfillIntentRequestRequest("NameIntent", {
      slot1: "something",
    });
    const reply = (await alexaSkill.execute(
      event,
      new AlexaReply(),
    )) as AlexaReply;

    expect(reply.response.card).to.be.undefined;
    expect(reply.response.reprompt).to.be.undefined;
    expect(reply.response.outputSpeech).to.be.undefined;
    expect(reply.response.canFulfillIntent).to.deep.equal(canFulfillIntent);
  });

  it("should not fulfill request", async () => {
    const canFulfillIntent: canfulfill.CanFulfillIntent = {
      canFulfill: "NO",
    };

    const voxaApp = new VoxaApp({ views, variables });
    const alexaSkill = new AlexaPlatform(voxaApp);
    voxaApp.onCanFulfillIntentRequest(
      (alexaEvent: AlexaEvent, alexaReply: AlexaReply) => {
        alexaReply.fulfillIntent("NO");
        return alexaReply;
      },
    );

    event = rb.getCanFulfillIntentRequestRequest("NameIntent", {
      slot1: "something",
    });
    const reply = (await alexaSkill.execute(
      event,
      new AlexaReply(),
    )) as AlexaReply;

    expect(reply.response.card).to.be.undefined;
    expect(reply.response.reprompt).to.be.undefined;
    expect(reply.response.outputSpeech).to.be.undefined;
    expect(reply.response.canFulfillIntent).to.deep.equal(canFulfillIntent);
  });

  it("should not fulfill request with wrong values", async () => {
    const canFulfillIntent: canfulfill.CanFulfillIntent = {
      canFulfill: "NO",
      slots: {
        slot1: {
          canFulfill: "NO",
          canUnderstand: "NO",
        },
      },
    };

    const voxaApp = new VoxaApp({ views, variables });
    const alexaSkill = new AlexaPlatform(voxaApp);
    voxaApp.onCanFulfillIntentRequest(
      (alexaEvent: AlexaEvent, alexaReply: AlexaReply) => {
        alexaReply.fulfillIntent("yes");
        alexaReply.fulfillSlot("slot1", "yes", "yes");
        return alexaReply;
      },
    );

    event = rb.getCanFulfillIntentRequestRequest("NameIntent", {
      slot1: "something",
    });
    const reply = (await alexaSkill.execute(
      event,
      new AlexaReply(),
    )) as AlexaReply;

    expect(reply.response.card).to.be.undefined;
    expect(reply.response.reprompt).to.be.undefined;
    expect(reply.response.outputSpeech).to.be.undefined;
    expect(reply.response.canFulfillIntent).to.deep.equal(canFulfillIntent);
  });

  describe("onUnhandledState", () => {
    it(
      "should call onUnhandledState callbacks when the state" +
        " machine transition throws a UnhandledState error",
      async () => {
        const voxaApp = new VoxaApp({ Model, views, variables });
        const onUnhandledState = simple.stub().resolveWith({
          tell: "ExitIntent.Farewell",
        });

        voxaApp.onUnhandledState(onUnhandledState);

        const launchEvent = rb.getIntentRequest("LaunchIntent");
        statesDefinition.entry = simple.stub().resolveWith(null);

        _.map(statesDefinition, (state: any, name: string) =>
          voxaApp.onState(name, state),
        );
        const reply = (await voxaApp.execute(
          new AlexaEvent(launchEvent),
          new AlexaReply(),
        )) as AlexaReply;
        expect(onUnhandledState.called).to.be.true;
        expect(reply.speech).to.equal(
          "<speak>Ok. For more info visit example.com site.</speak>",
        );
      },
    );
  });

  it("should include all directives in the reply", async () => {
    const voxaApp = new VoxaApp({ Model, variables, views });

    const directives = [new PlayAudio("url", "123", 0, "REPLACE_ALL")];

    voxaApp.onIntent("SomeIntent", () => ({
      directives,
      tell: "ExitIntent.Farewell",
      to: "entry",
    }));

    const reply = (await voxaApp.execute(
      new AlexaEvent(event),
      new AlexaReply(),
    )) as AlexaReply;
    expect(reply.response.directives).to.not.be.undefined;
    expect(reply.response.directives).to.have.length(1);
    expect(reply.response.directives).to.deep.equal([
      {
        audioItem: {
          metadata: {},
          stream: {
            offsetInMilliseconds: 0,
            token: "123",
            url: "url",
          },
        },
        playBehavior: "REPLACE_ALL",
        type: "AudioPlayer.Play",
      },
    ]);
  });

  it("should include all directives in the reply even if die", async () => {
    const voxaApp = new VoxaApp({ Model, variables, views });

    const directives = [new PlayAudio("url", "123", 0, "REPLACE_ALL")];

    voxaApp.onIntent("SomeIntent", () => ({
      directives,
      say: "ExitIntent.Farewell",
    }));

    const reply = (await voxaApp.execute(
      new AlexaEvent(event),
      new AlexaReply(),
    )) as AlexaReply;
    expect(reply.response.directives).to.not.be.undefined;
    expect(reply.response.directives).to.have.length(1);
    expect(reply.response.directives).to.deep.equal([
      {
        audioItem: {
          metadata: {},
          stream: {
            offsetInMilliseconds: 0,
            token: "123",
            url: "url",
          },
        },
        playBehavior: "REPLACE_ALL",
        type: "AudioPlayer.Play",
      },
    ]);
  });

  it("should render all messages after each transition", async () => {
    const voxaApp = new VoxaApp({ Model, views, variables });

    const launchEvent = rb.getIntentRequest("LaunchIntent");
    statesDefinition.entry = {
      LaunchIntent: "fourthState",
    };

    statesDefinition.fourthState = (request: IVoxaEvent) => {
      request.model.count = 0;
      return { say: "Count.Say", to: "fifthState" };
    };

    statesDefinition.fifthState = (request: IVoxaEvent) => {
      request.model.count = 1;
      return { tell: "Count.Tell", to: "die" };
    };

    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );
    const reply = (await voxaApp.execute(
      new AlexaEvent(launchEvent),
      new AlexaReply(),
    )) as AlexaReply;
    expect(reply.speech).to.deep.equal("<speak>0\n1</speak>");
  });

  it("should call onIntentRequest callbacks before the statemachine", async () => {
    const voxaApp = new VoxaApp({ views, variables });
    _.map(statesDefinition, (state: any, name: string) =>
      voxaApp.onState(name, state),
    );
    const stubResponse = "STUB RESPONSE";
    const stub = simple.stub().resolveWith(stubResponse);
    voxaApp.onIntentRequest(stub);

    const reply = (await voxaApp.execute(
      new AlexaEvent(event),
      new AlexaReply(),
    )) as AlexaReply;
    expect(stub.called).to.be.true;
    expect(reply).to.not.equal(stubResponse);
    expect(reply.speech).to.equal(
      "<speak>Ok. For more info visit example.com site.</speak>",
    );
  });

  describe("onRequestStarted", () => {
    it("should return the onError response for exceptions thrown in onRequestStarted", async () => {
      const voxaApp = new VoxaApp({ views, variables });
      const spy = simple.spy(() => {
        throw new Error("FAIL!");
      });

      voxaApp.onRequestStarted(spy);

      await voxaApp.execute(new AlexaEvent(event), new AlexaReply());
      expect(spy.called).to.be.true;
    });
  });

  describe("Reply", () => {
    it("should pick up the say and reprompt statements", async () => {
      const voxaApp = new VoxaApp({ views, variables });
      const launchEvent = rb.getIntentRequest("LaunchIntent");
      voxaApp.onIntent("LaunchIntent", {
        flow: "yield",
        reply: "Reply.Say",
        to: "entry",
      });
      const response = (await voxaApp.execute(
        new AlexaEvent(launchEvent),
        new AlexaReply(),
      )) as AlexaReply;
      expect(response.speech).to.deep.equal("<speak>this is a say</speak>");
      expect(response.reprompt).to.deep.equal(
        "<speak>this is a reprompt</speak>",
      );
      expect(response.hasTerminated).to.be.false;
    });

    it("should pick up Hint and card statements", async () => {
      const voxaApp = new VoxaApp({ views, variables });
      voxaApp.onIntent("SomeIntent", {
        flow: "yield",
        reply: "Reply.Card",
        reprompt: "Reprompt",
        say: "Say",
        to: "entry",
      });
      const alexaSkill = new AlexaPlatform(voxaApp);
      const response = await alexaSkill.execute(event, {});

      expect(_.get(response, "response.outputSpeech.ssml")).to.deep.equal(
        "<speak>say</speak>",
      );
      expect(
        _.get(response, "response.reprompt.outputSpeech.ssml"),
      ).to.deep.equal("<speak>reprompt</speak>");
      expect(response.response.card).to.deep.equal({
        image: {
          largeImageUrl: "https://example.com/large.jpg",
          smallImageUrl: "https://example.com/small.jpg",
        },
        title: "Title",
        type: "Standard",
      });
      expect(_.get(response, "response.directives[0]")).to.deep.equal({
        hint: {
          text: "this is the hint",
          type: "PlainText",
        },
        type: "Hint",
      });
    });
  });
});