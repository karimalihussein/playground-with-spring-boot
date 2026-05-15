package com.playground.bench.client;

import com.playground.bench.rpc.proto.ChatMessage;
import com.playground.bench.rpc.proto.NumberBenchGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.stub.StreamObserver;
import java.util.Scanner;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Tiny interactive bidirectional demo: type lines in the terminal, see echoed {@link ChatMessage} replies.
 * This makes “two independent halves of one stream” tangible without a browser.
 */
public final class GrpcStreamInteractiveDemo {

	public static void main(String[] args) throws Exception {
		String host = "localhost";
		int port = 9090;
		for (int i = 0; i < args.length; i++) {
			switch (args[i]) {
				case "-h" -> host = args[++i];
				case "-p" -> port = Integer.parseInt(args[++i]);
				default -> throw new IllegalArgumentException("args: -h host -p port");
			}
		}

		ManagedChannel channel = ManagedChannelBuilder.forAddress(host, port).usePlaintext().build();
		NumberBenchGrpc.NumberBenchStub async = NumberBenchGrpc.newStub(channel);
		CountDownLatch hangup = new CountDownLatch(1);
		AtomicBoolean failed = new AtomicBoolean();

		StreamObserver<ChatMessage> responses = new StreamObserver<>() {
			@Override
			public void onNext(ChatMessage value) {
				System.out.println("[server] " + value.getText() + " (seq=" + value.getSeq() + ")");
			}

			@Override
			public void onError(Throwable t) {
				failed.set(true);
				System.err.println("stream error: " + t);
				hangup.countDown();
			}

			@Override
			public void onCompleted() {
				System.out.println("[stream completed]");
				hangup.countDown();
			}
		};

		StreamObserver<ChatMessage> requests = async.chatStream(responses);
		System.out.println("Type a message and press Enter. Commands: /quit closes the client stream.");
		boolean finished = false;
		try (Scanner scanner = new Scanner(System.in)) {
			long seq = 0;
			while (scanner.hasNextLine()) {
				String line = scanner.nextLine();
				if ("/quit".equalsIgnoreCase(line.trim())) {
					finished = true;
					requests.onCompleted();
					break;
				}
				requests.onNext(ChatMessage.newBuilder()
						.setClientId("demo-cli")
						.setText(line)
						.setSeq(++seq)
						.build());
			}
		}
		finally {
			if (!finished) {
				requests.onCompleted();
			}
		}

		hangup.await(10, TimeUnit.SECONDS);
		channel.shutdownNow();
		channel.awaitTermination(3, TimeUnit.SECONDS);
		if (failed.get()) {
			System.exit(2);
		}
	}

	private GrpcStreamInteractiveDemo() {
	}
}
