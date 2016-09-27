var restify = require('restify');
var builder = require('botbuilder');
var calling = require('./botbuilder-calling/lib/botbuilder');
var prompts = require('./prompts');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

server.get(/.*/, restify.serveStatic({
	'directory': __dirname
}));
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'a1288229-a570-4007-8987-3438328a22a1',
    appPassword: 'NLP5Rvb0kaH0GotYjYiEydJ'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var callconnector = new calling.CallConnector({
    callbackUrl: 'https://soprademo.herokuapp.com/api/calls',
    appId:'a1288229-a570-4007-8987-3438328a22a1',
    appPassword: 'NLP5Rvb0kaH0GotYjYiEydJ'
});
var callbot = new calling.UniversalCallBot(callconnector);
server.post('/api/calls', callconnector.listen());



//=========================================================
// Activity Events
//=========================================================

bot.on('conversationUpdate', function (message) {
   // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                            .address(message.address)
                            .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me. Say 'hello' to see some great demos.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('typing', function (message) {
    // User is typing
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});


//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("Sopra Demo")
            .text("Wellcome to Nespresso")
            .images([
                 builder.CardImage.create(session, "https://soprademo.herokuapp.com/images/nespresso.png")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.beginDialog('/help');
    },
    function (session, results) {
        // Display menu
        session.beginDialog('/menu');
    },
    function (session, results) {
        // Always say goodbye
        session.send("Ok... See you later!");
    }
]);

bot.dialog('/menu', [
    function (session) {
        console.log(session.message);
        builder.Prompts.choice(session, "What do you want to do?", "buy|receipt|quit");
    },
    function (session, results) {
        if (results.response && results.response.entity != 'quit') {
            // Launch demo dialog
            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

bot.dialog('/help', [
    function (session) {
        session.endDialog("Global commands that are available anytime:\n\n* menu - Exits a demo and returns to the menu.\n* goodbye - End this conversation.\n* help - Displays these commands.");
    }
]);

bot.dialog('/buy', [
    function (session) {
        session.send("You can buy your Nespresso capsules.");
        
        // Ask the user to select an item from a carousel.
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                    .title("Ristretto")
                    .text("Powerful and contrasting 0.39€")
                    .images([
                        builder.CardImage.create(session, "https://soprademo.herokuapp.com/images/ristretto.png")
                            .tap(builder.CardAction.showImage(session, "https://soprademo.herokuapp.com/images/ristretto.png")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://www.nespresso.com/uk/en/order/capsules/ristretto-coffee-capsule", "Go to web"),
                        builder.CardAction.imBack(session, "select:100", "Select")
                    ]),
                new builder.HeroCard(session)
                    .title("Cosi")
                    .text("Mild and delicately toasted 0.39€")
                    .images([
                        builder.CardImage.create(session, "https://soprademo.herokuapp.com/images/cosi.png")
                            .tap(builder.CardAction.showImage(session, "https://soprademo.herokuapp.com/images/cosi.png")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://www.nespresso.com/uk/en/order/capsules/cosi-coffee-capsule", "Go to web"),
                        builder.CardAction.imBack(session, "select:101", "Select")
                    ]),
                new builder.HeroCard(session)
                    .title("Volluto")
                    .text("Sweet and light")
                    .images([
                        builder.CardImage.create(session, "https://soprademo.herokuapp.com/images/volluto.png")
                            .tap(builder.CardAction.showImage(session, "https://soprademo.herokuapp.com/images/volluto.png"))
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://www.nespresso.com/uk/en/order/capsules/volluto-coffee-capsule", "Google Play"),
                        builder.CardAction.imBack(session, "select:102", "Select")
                    ])
            ]);
        builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    },
    function (session, results) {
        var action, item;
        var kvPair = results.response.entity.split(':');
        switch (kvPair[0]) {
            case 'select':
                action = 'selected';
                break;
        }
        switch (kvPair[1]) {
            case '100':
                item = "Ristretto";
                break;
            case '101':
                item = "Cosi";
                break;
            case '102':
                item = "Volluto";
                break;
        }
        session.endDialog('You %s "%s"', action, item);
    }    
]);

bot.dialog('/receipt', [
    function (session) {
        session.send("Here you have your purchased capsules");
        
        // Send a receipt with images
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Bernat Palacin")
                    .items([
                        builder.ReceiptItem.create(session, "$39.00", "Ristretto (100)").image(builder.CardImage.create(session, "https://soprademo.herokuapp.com/images/ristretto.png")),
                        builder.ReceiptItem.create(session, "$19.50", "Volluto (50)").image(builder.CardImage.create(session, "https://soprademo.herokuapp.com/images/volluto.png"))
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method"),
                        builder.Fact.create(session, "WILLCALL", "Delivery Method")
                    ])
                    .tax("$12.29")
                    .total("$50.79")
            ]);
        session.endDialog(msg);
    }
]);

//*****************************************************************


//=========================================================
// Calling Dialogs
//=========================================================

callbot.dialog('/', [
    function (session) {
        // Send a greeting and start the menu.
        if (!session.userData.welcomed) {
            session.userData.welcomed = true;
            session.send(prompts.welcome);
            session.beginDialog('/demoMenu', { full: true });
        } else {
            session.send(prompts.welcomeBack);
            session.beginDialog('/demoMenu', { full: false });
        }
    },
    function (session, results) {
        // Always say goodbye
        session.send(prompts.goodbye);
    }
]);

callbot.dialog('/demoMenu', [
    function (session, args) {
        // Build up a stack of prompts to play
        var list = [];
        list.push(calling.Prompt.text(session, prompts.demoMenu.prompt));
        if (!args || args.full) {
            list.push(calling.Prompt.text(session, prompts.demoMenu.choices));
            list.push(calling.Prompt.text(session, prompts.demoMenu.help));
        }

        // Prompt user to select a menu option
        calling.Prompts.choice(session, new calling.PlayPromptAction(session).prompts(list), [
            { name: 'dtmf', speechVariation: ['dtmf'] },
            { name: 'digits', speechVariation: ['digits'] },
            { name: 'record', speechVariation: ['record', 'recordings'] },
            { name: 'chat', speechVariation: ['chat', 'chat message'] },
            { name: 'choices', speechVariation: ['choices', 'options', 'list'] },
            { name: 'help', speechVariation: ['help', 'repeat'] },
            { name: 'quit', speechVariation: ['quit', 'end call', 'hangup', 'goodbye'] }
        ]);
    },
    function (session, results) {
        if (results.response) {
            switch (results.response.entity) {
                case 'choices':
                    session.send(prompts.demoMenu.choices);
                    session.replaceDialog('/demoMenu', { full: false });
                    break;
                case 'help':
                    session.replaceDialog('/demoMenu', { full: true });
                    break;
                case 'quit':
                    session.endDialog();
                    break;
                default:
                    // Start demo
                    session.beginDialog('/' + results.response.entity);
                    break;
            }
        } else {
            // Exit the menu
            session.endDialog(prompts.canceled);
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/demoMenu', { full: false });
    }
]);

callbot.dialog('/dtmf', [
    function (session) {
        session.send(prompts.dtmf.intro);
        calling.Prompts.choice(session, prompts.dtmf.prompt, [
            { name: 'option A', dtmfVariation: '1' },
            { name: 'option B', dtmfVariation: '2' },
            { name: 'option C', dtmfVariation: '3' }
        ]);
    },
    function (session, results) {
        if (results.response) {
            session.endDialog(prompts.dtmf.result, results.response.entity);
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

callbot.dialog('/digits', [
    function (session, args) {
        if (!args || args.full) {
            session.send(prompts.digits.intro);
        }
        calling.Prompts.digits(session, prompts.digits.prompt, 10, { stopTones: '#' });
    },
    function (session, results) {
        if (results.response) {
            // Confirm the users account is valid length otherwise reprompt.
            if (results.response.length >= 5) {
                var prompt = calling.PlayPromptAction.text(session, prompts.digits.confirm, results.response);
                calling.Prompts.confirm(session, prompt, results.response);
            } else {
                session.send(prompts.digits.inavlid);
                session.replaceDialog('/digits', { full: false });
            }
        } else {
            session.endDialog(prompts.canceled);
        }
    },
    function (session, results) {
        if (results.resumed == calling.ResumeReason.completed) {
            if (results.response) {
                session.endDialog();
            } else {
                session.replaceDialog('/digits', { full: false });
            }
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

callbot.dialog('/record', [
    function (session) {
        session.send(prompts.record.intro);
        calling.Prompts.record(session, prompts.record.prompt, { playBeep: true });
    },
    function (session, results) {
        if (results.response) {
            session.endDialog(prompts.record.result, results.response.lengthOfRecordingInSecs);
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

// Import botbuilder core library and setup chat bot

callbot.dialog('/chat', [
    function (session) {
        session.send(prompts.chat.intro);
        calling.Prompts.confirm(session, prompts.chat.confirm);        
    },
    function (session, results) {
        if (results.response) {
            // Delete conversation field from address to trigger starting a new conversation.
            var address = session.message.address;
            delete address.conversation;

            // Create a new chat message and pass it callers address
            var msg = new builder.Message()
                .address(address)
                .attachments([
                    new builder.HeroCard(session)
                        .title("Hero Card")
                        .subtitle("Space Needle")
                        .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                        .images([
                            builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                        ])
                        .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                ]);

            // Send message through chat bot
            bot.send(msg, function (err) {
                session.endDialog(err ? prompts.chat.failed : prompts.chat.sent);
            });
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);