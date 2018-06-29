{
    "interactionModel": {
        "languageModel": {
            "invocationName": "da bus",
            "intents": [
                {
                    "name": "AMAZON.FallbackIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.CancelIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.HelpIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.StopIntent",
                    "samples": []
                },
                {
                    "name": "nextBus",
                    "slots": [
                        {
                            "name": "Stop",
                            "type": "AMAZON.NUMBER"
                        }
                    ],
                    "samples": [
                        "Stop number {Stop}",
                        "{Stop}",
                        "Number {Stop}", 
			"I live near stop {Stop}",
                        "what about {Stop}",
			"when is the next bus for stop {Stop}",
			"when is the next bus at stop {Stop}",
			"when is the next bus at {Stop}",
			"when's the next bus at {Stop}"
                    ]
                }
            ],
            "types": []
        }
    }
}
