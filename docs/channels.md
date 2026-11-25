# Channel adapters

The web chat, the embed widget, WhatsApp, and Messenger all call `respond()` in `lib/llm.ts`. With no API key that function is the deterministic demo engine. The same intake tools, refusals, and handoffs apply on every channel.

## WhatsApp Cloud API

Callback URL: `https://legal-chat.quvantic.com/api/webhooks/whatsapp`

Verify token: `WHATSAPP_VERIFY_TOKEN` (default `demo-verify-token` in this demo).

`GET` answers the hub challenge. `POST` reads `entry[].changes[].value.messages[]`, runs the agent, and returns the reply plus the outbound Cloud API payload. Set `WHATSAPP_TOKEN` only if you later forward that payload to Graph. This demo does not call Graph.

## Facebook Messenger

Callback URL: `https://legal-chat.quvantic.com/api/webhooks/messenger`

Verify token: `MESSENGER_VERIFY_TOKEN` (same default).

`POST` reads `entry[].messaging[].message.text` and maps it through the same agent. The JSON response includes the Send API body. Set `MESSENGER_PAGE_TOKEN` only if you forward it.

Sample payloads live in `tests/platform.test.ts`.
