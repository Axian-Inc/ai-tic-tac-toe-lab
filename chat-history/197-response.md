# Response
Added an opt-in Bedrock integration test that calls the live model across multiple game states and opponent profiles, asserting legal JSON moves. Documented the opt-in flow in testing strategy.

Run with:
RUN_BEDROCK_INTEGRATION=1 BEDROCK_MODEL_ID=... npm test