console.log('starting');

//=========================================================================================================================================
// packages and services
//=========================================================================================================================================

const Alexa = require('ask-sdk');
var http = require('http');

// keys can be obtain via: http://hea.thebus.org/api_info.asp

var keys = {
    daBusApiKey: '<insert-your-key-here>'
};


//=========================================================================================================================================
// CONSTANTS & MESSAGES
//=========================================================================================================================================

const SKILL_NAME = 'da Bus';
const HELP_MESSAGE = 'Tell me the number of the stop you are interested in';
const HELP_REPROMPT = 'For example, you could say, "Stop number 3616, or just the number of the stop". What stop are you interested in?';
const STOP_MESSAGE = 'Mahalo for riding da Bus! Goodbye!';
const NO_ITEM_FOUND = "No can. Sorry.";
const ERROR_TEXT = 'No can. Sorry.';
const FALLBACK_MESSAGE = NO_ITEM_FOUND;
const FALLBACK_REPROMPT = "Please try again.";

//=========================================================================================================================================
// HANDLER DEFINITIONS
//=========================================================================================================================================

const NextBusHandler = {
    canHandle(handlerInput) {
	const request = handlerInput.requestEnvelope.request;

	console.log ('request type: ', request.type);

	if(request.type === 'LaunchRequest') { console.log('in nextBus handler launch request is: ', request); }
	if(request.type === 'AMAZON.FallbackIntent') { console.log('FALLBACK: handler launch request is: ', request); }

	return (request.type === 'IntentRequest' && (request.intent.name === 'nextBus') );
    },

    handle(handlerInput) {
	const request = handlerInput.requestEnvelope.request;
	var query = request.intent.slots.Stop.value;
	console.log('query: ', query);
	
	return new Promise((resolve) => {
	    httpGet(query, (theResult) => {
		var speechOutput = "";
		if(theResult) {
		    // console.log("sent     : " + query);
		    // console.log("received : " + JSON.stringify(theResult));
		   
		    speechOutput = "The bus will arrive at stop " + theResult.stop + " at " + theResult.stopTime;
		    resolve(handlerInput.responseBuilder
			    .speak(speechOutput).withSimpleCard(SKILL_NAME, speechOutput)
			    .reprompt("Anything else?")
			    .getResponse());
		}
		else {
		    resolve(handlerInput.responseBuilder
			    .speak(NO_ITEM_FOUND).withSimpleCard(SKILL_NAME, NO_ITEM_FOUND)
			    .reprompt("Please try again?")
			    .getResponse());
		}
            });
	});
    }
};

// straight from the Amazon examples at: https://github.com/alexa/skill-sample-nodejs-fact
const FallbackHandler = {
  // 2018-May-01: AMAZON.FallackIntent is only currently available in en-US locale.
  //              This handler will not be triggered except in that locale, so it can be
  //              safely deployed for any locale.
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(FALLBACK_MESSAGE)
      .reprompt(FALLBACK_REPROMPT)
      .getResponse();
  },
};

const HelpHandler = {
    canHandle(handlerInput) {
	const request = handlerInput.requestEnvelope.request;
	console.log('help handler:', request);
	// return true;
	return (request.type === 'LaunchRequest') || (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
	return handlerInput.responseBuilder
	    .speak(HELP_MESSAGE)
	    .reprompt(HELP_REPROMPT)
	    .getResponse();
    },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && (request.intent.name === 'AMAZON.CancelIntent'  || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
    canHandle() {
	return true;
    },
    handle(handlerInput, error) {
	console.log(`Error handled: ${error.message}`);

	return handlerInput.responseBuilder
	    .speak(ERROR_TEXT)
	    .reprompt(ERROR_TEXT)
	    .getResponse();
    },
};


function httpGet(query, callback) {
    // http://api.thebus.org/arrivals/?key=<key>&stop=1276
    console.log(query);
    var options = {
	host: 'api.thebus.org',
	path: '/arrivals/?key=' + keys.daBusApiKey + '&stop=' + query,
	method: 'GET',
    };

    console.log(options.host + options.path);
    var req = http.request(options, res => {
	res.setEncoding('utf8');
	var responseString = "";

	//accept incoming data asynchronously
	res.on('data', chunk => {
	    responseString = responseString + chunk;
	});

	//return the data when streaming is complete
	res.on('end', () => {
	    // console.log(responseString);
	    var arrival = parseDaBusToJson(responseString);
	    if(!arrival) {
	    	console.log('empty result');
	    	callback(false);
	    }
	    else {
		callback(arrival);
	    }
	});
    });
    req.end();
}

// very crude parse XML to JSON. 
function parseDaBusToJson (xmlString) {

    var json = false;
    var stop = xmlString.match(/<stop>(.+?)<\/stop>/);
    stop = stop[1];
    var arrivals = xmlString.match(/<arrival>[\s\S]*?<\/arrival>/g);

    if(arrivals && (arrivals.length > 0)) {
	var arrival = arrivals[0];
	var id = arrival.match(/<id>(.+?)<\/id>/),
	    route = arrival.match(/<route>(.+?)<\/route>/),
	    headsign = arrival.match(/<headsign>(.+?)<\/headsign>/),
	    direction = arrival.match(/<direction>(.+?)<\/direction>/),
	    stopTime = arrival.match(/<stopTime>(.+?)<\/stopTime>/);
	    
	json = {
	    stop: stop,
	    id: id[1],
	    route: route[1],
	    headsign: headsign[1],
	    direction: direction[1],
	    stopTime: stopTime[1]
	};
    }

    return json;
}

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
    .addRequestHandlers(
	NextBusHandler,
	FallbackHandler,
	HelpHandler,
	ExitHandler,
	SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();

