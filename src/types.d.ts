interface FormatInput {
	done?: boolean;
	response?: string;
}

interface AsyncIterator<T = any> {
	[Symbol.asyncIterator](): AsyncIterableIterator<T>;
}

interface RequestBody {
	model: any;
	prompt: string;
	system: string;
}
