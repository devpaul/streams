const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');

import Evented from '@dojo/core/Evented';
import ReadableStream from '../../../src/ReadableStream';
import ReadableStreamReader, { ReadResult } from '../../../src/ReadableStreamReader';
import EventedStreamSource from '../../../src/adapters/EventedStreamSource';

let emitter: Evented;
let stream: ReadableStream<Event>;
let source: EventedStreamSource;
let reader: ReadableStreamReader<Event>;
let testEvent = {
	type: 'testEvent',
	test: 'value'
};

registerSuite('EventedStreamSource', {

	beforeEach() {
		emitter = new Evented();
		source = new EventedStreamSource(emitter, 'testEvent');
		stream = new ReadableStream<Event>(source);
		reader = stream.getReader();

		return stream.started;
	},

	tests: {
		start() {
			emitter.emit(testEvent);

			return reader.read().then(function (result: ReadResult<Event>) {
				assert.strictEqual(result.value, testEvent as any,
					'Event read from stream should be the same as the event emitted by emitter');
			});
		},

		'event array'() {
			let appleEvent = {
				type: 'apple',
				test: 'value'
			};
			let orangeEvent = {
				type: 'orange',
				test: 'value'
			};

			source = new EventedStreamSource(emitter, [ 'apple', 'orange' ]);
			stream = new ReadableStream<Event>(source);
			reader = stream.getReader();

			emitter.emit(appleEvent);
			emitter.emit(orangeEvent);

			return reader.read().then(function (result: ReadResult<Event>) {
				assert.strictEqual(result.value, appleEvent as any);

				return reader.read().then(function (result: ReadResult<Event>) {
					assert.strictEqual(result.value, orangeEvent as any);
				});
			});
		},

		cancel() {
			let enqueueCallCount = 0;

			stream.controller.enqueue = function (chunk: Event) {
				enqueueCallCount += 1;
			};

			source.cancel();
			emitter.emit(testEvent);
			assert.strictEqual(enqueueCallCount, 0, 'Canceled source should not call controller.enqueue');
		}
	}
});
