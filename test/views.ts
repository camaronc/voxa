export const views =  {
  "de-DE": {
    translation: {
      ExitIntent: {
        Farewell: "Ok für weitere Infos besuchen {site} Website" ,
      },
      LaunchIntent: {
        OpenResponse: "Hallo! guten {time}",
      },
      Number: {
        One:  "{numberOne}" ,
      },
      Question: {
        Ask:  "wie spät ist es?" ,
      },
      RandomResponse: [
        "zufällig1",
        "zufällig2",
        "zufällig3",
        "zufällig4",
        "zufällig5",
      ],
      Say: {
        Say: "sagen" ,
      },
    },
  },
  "en-US": {
    translation: {
      BadInput: {
        RepeatLastAskReprompt: {
          say: "I'm sorry. I didn't understand.",
        },
      },
      Buttons: {
        Bye: "Thanks for playing with echo buttons.",
        Discover: "Press 2 or up to 4 buttons to wake them up.",
        Next: "Guess the next pattern.",
      },
      Card: {
        image: {
          largeImageUrl: "https://example.com/large.jpg",
          smallImageUrl: "https://example.com/small.jpg",
        },
        title: "Title",
        type: "Standard",
      },
      Card2: "{card2}",
      Count: {
        Say:  "{count}",
        Tell: "{count}" ,
      },
      DialogFlowBasicCard: {
        buttons: {
          openUrlAction: "https://example.com",
          title: "Example.com",
        },
        display: "DEFAULT",
        image:  {
          url: "https://example.com/image.png",
        },
        subtitle: "subtitle",
        text: "This is the text",
        title: "title",
      },
      DialogFlowCarousel: {
        items: {
          LIST_ITEM: {
            description: "The item description",
            title: "the list item",
          },
        },
      },
      DialogFlowListSelect: {
        items: [
          {
            description: "The item description",
            image: {
              accessibilityText: "The image",
              url: "http://example.com/image.jpg",
            },
            title: "The list item",
          },
        ],
        title: "The list select",
      },
      ExitIntent: {
        Farewell: "Ok. For more info visit {site} site.",
      },
      Help: "This is the help",
      HelpIntent: {
        HelpAboutSkill: "For more help visit www.rain.agency" ,
      },
      Hint: "string",
      LaunchIntent: {
        OpenResponse: {
          alexa: "Hello! Good {time}",
          dialogFlow: "Hello from DialogFlow",
        },
      },
      Number: {
        One: "{numberOne}" ,
      },
      Playing: {
        SayStop: {
          ask: "Say stop if you want to finish the playback",
        },
      },
      Question: {
        Ask: {
          ask: "What time is it?",
          reprompt: "What time is it?",
        },

      },
      RandomResponse: [
        "Random 1",
        "Random 2",
        "Random 3",
        "Random 4",
      ],
      RenderTemplate: {
        template: {
          backButton: "VISIBLE",
          backgroundImage: "Image",
          textContent: {
            primaryText: {
              text: "string",
              type: "string",
            },
            secondaryText: {
              text: "string",
              type: "string",
            },
            tertiaryText: {
              text: "string",
              type: "string",
            },
          },
          title: "string",
          token: "string",
          type: "BodyTemplate1",
        },
        type: "Display.RenderTemplate",
      },
      Reply: {
        Ask: {
          ask: "this is an ask",
          reprompt: "this is a reprompt",
        },
        Combined: {
          ask: "this is an ask",
          directives: ["{hintDirective}"],
          reprompt: "this is a reprompt",
        },
        Directives: {
          directives: ["{hintDirective}"],
        },
        Tell: {
          tell: "this is a tell",
        },
      },
      Say: {
        Say: "say" ,
      },
    },
  },
};