import { iteratorToStream, ExtractFromStream } from './utils';
import OpenAI from 'openai';

export interface Env {
	AI: Ai;
	CLOUDFLARE_API_KEY: string;
	CLOUDFLARE_ACCOUNT_ID: string;
}
export default {
	async fetch(request, env, _ctx): Promise<Response> {
		const cors = {
			'access-control-allow-origin': '*',
			'access-control-allow-headers': '*',
		};
		if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

		const url = new URL(request.url);

		if (url.hostname !== 'localhost') {
			return fetch(`http://localhost:11434${url.pathname}`, request);
		} else {
			switch (url.pathname) {
				case '/api/tags':
					const models = { models: [{ name: '@cf/meta/llama-3.1-8b-instruct' }, { name: '@hf/mistral/mistral-7b-instruct-v0.2' }] };
					return new Response(JSON.stringify(models), { headers: { 'content-type': 'application/json', ...cors } });
				case '/api/generate':
					const { model, prompt, system }: RequestBody = await request.json();
					const messages: any = [
						{ role: 'system', content: system },
						{ role: 'user', content: prompt },
					];
					const payload = { messages, model, stream: true };

					// const openai = new OpenAI({
					// 	apiKey: env.CLOUDFLARE_API_KEY,
					// 	baseURL: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
					// });
					// const response = await openai.chat.completions.create(payload);
					// const stream = iteratorToStream(response).pipeThrough(new ExtractFromStream('content')).pipeThrough(new TextEncoderStream());

					// const response = await env.AI.run(model, {
					// 	prompt,
					// 	stream: true,
					// });
					// const stream = (response as ReadableStream)
					// 	?.pipeThrough(new TextDecoderStream())
					// 	.pipeThrough(new ExtractFromStream('response'))
					// 	.pipeThrough(new TextEncoderStream());

					const response = await fetch(
						`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
						{
							method: 'POST',
							headers: { authorization: `Bearer ${env.CLOUDFLARE_API_KEY}` },
							body: JSON.stringify(payload),
						},
					).then((r) => r.body);
					const stream = (response as ReadableStream)
						?.pipeThrough(new TextDecoderStream())
						.pipeThrough(new ExtractFromStream('content'))
						.pipeThrough(new TextEncoderStream());

					return new Response(stream, {
						headers: { 'content-type': 'text/event-stream', ...cors },
					});
				default:
					return new Response('ok');
			}
		}
	},
} satisfies ExportedHandler<Env>;
