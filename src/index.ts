/**
 * Voxa
 *
 * Copyright (c) 2018 Rain Agency.
 * Licensed under the MIT license.
 */

export { Tell, Say, SayP, Ask, Reprompt } from "./directives";
export { VoxaPlatform } from "./platforms";
export {
  IVoxaEvent,
  IVoxaIntentEvent,
  IVoxaIntent,
  IVoxaAlexaUserProfile,
  IVoxaGoogleUserProfile,
  IVoxaUserProfile,
  VoxaEvent,
} from "./VoxaEvent";
export { IVoxaReply } from "./VoxaReply";
export {
  AlexaReply,
  AlexaPlatform,
  AccountLinkingCard as AlexaAccountLinkingCard,
  AlexaEvent,
  APLCommand,
  APLTemplate,
  ANCHOR_ENUM,
  ConnectionsSendRequest,
  DialogDelegate,
  DisplayTemplate,
  EVENT_REPORT_ENUM,
  GadgetController,
  GadgetControllerLightDirective,
  GameEngine,
  GameEngineStartInputHandler,
  GameEngineStopInputHandler,
  HomeCard,
  PlayAudio,
  ReminderBuilder,
  RenderTemplate,
  StopAudio,
  TRIGGER_EVENT_ENUM,
  Hint,
} from "./platforms/alexa";
export {
  EventBuilder,
  GARBAGE_COLLECTION_DAY,
  GARBAGE_TYPE,
  IMessageRequest,
  MEDIA_CONTENT_METHOD,
  MEDIA_CONTENT_TYPE,
  MediaContentEventBuilder,
  MESSAGE_ALERT_FRESHNESS,
  MESSAGE_ALERT_STATUS,
  MESSAGE_ALERT_URGENCY,
  MessageAlertEventBuilder,
  Messaging,
  OCCASION_CONFIRMATION_STATUS,
  OCCASION_TYPE,
  OccasionEventBuilder,
  ORDER_STATUS,
  OrderStatusEventBuilder,
  ProactiveEvents,
  SOCIAL_GAME_INVITE_TYPE,
  SOCIAL_GAME_OFFER,
  SOCIAL_GAME_RELATIONSHIP_TO_INVITEE,
  SocialGameInviteEventBuilder,
  SportsEventBuilder,
  TrashCollectionAlertEventBuilder,
  WEATHER_ALERT_TYPE,
  WeatherAlertEventBuilder,
} from "./platforms/alexa/apis";
export {
  BotFrameworkPlatform,
  AudioCard,
  BotFrameworkEvent,
  BotFrameworkReply,
  HeroCard,
  SigninCard,
  SuggestedActions,
} from "./platforms/botframework";
export {
  DialogFlowReply,
  DialogFlowPlatform,
  AccountLinkingCard as DialogFlowAccountLinkingCard,
  BasicCard,
  Carousel,
  DialogFlowEvent,
  FacebookAccountLink,
  FacebookSuggestionChips,
  List,
  MediaResponse,
  Suggestions,
} from "./platforms/dialogflow";
export { Renderer } from "./renderers/Renderer";
export { VoxaApp } from "./VoxaApp";
export { ITransition, State } from "./StateMachine";
export {
  TimeoutError,
  OnSessionEndedError,
  UnknownState,
  UnknownRequestType,
  NotImplementedError,
} from "./errors";
export { Model } from "./Model";

import { autoLoad, replaceIntent, stateFlow } from "./plugins";

export const plugins = {
  autoLoad,
  replaceIntent,
  stateFlow,
};
