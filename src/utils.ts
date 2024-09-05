export class ExtractFromStream extends TransformStream {
	buffer: string;
	dataKey: string;
	constructor(dataKey: string) {
		super({
			transform: (chunk, controller) => this.transform(chunk, controller),
			flush: (controller) => this.flush(controller),
		});
		this.buffer = '';
		this.dataKey = dataKey;
	}
	transform(chunk: any, controller: any) {
		for (const s of chunk) {
			switch (s) {
				case '{':
					this.buffer = s;
					break;
				case '}':
					this.buffer += s;
					if (/{.+}/.test(this.buffer)) {
						controller.enqueue(this.format({ response: JSON.parse(this.buffer)[this.dataKey] }));
						this.buffer = '';
					}
					break;
				default:
					this.buffer += s;
			}
		}
	}
	flush(controller: any) {
		controller.enqueue(this.format({ done: true }));
	}
	format(payload: FormatInput) {
		const formatted = {
			model: '',
			done: false,
			response: '',
			created_at: '',
			...payload,
		};
		return JSON.stringify(formatted) + '\n';
	}
}

export function iteratorToStream(stream: unknown) {
	return new ReadableStream({
		async pull(controller) {
			for await (const chunk of stream as AsyncIterator) {
				controller.enqueue(JSON.stringify(chunk) + '\n');
			}
			controller.close();
		},
	});
}
