# Chapter 20: Async

We are now entering the realm of **Concurrency**.

Imagine a standard, single-threaded web server. A client connects and asks for a file. The server asks the hard drive for the file. Hard drives are incredibly slow compared to the CPU. 
While the server waits 50 milliseconds for the hard drive to spin up, the entire CPU thread freezes. If another client tries to connect during those 50 milliseconds, they are blocked. 

This is called "Synchronous" or "Blocking" code. To handle 10,000 users, you would need to spawn 10,000 heavy OS threads, which would instantly run your machine out of RAM and crash.

We need a way for the CPU to start a task, realize it requires waiting, and instantly pivot to handle a different user instead of freezing.

:::definition
`async` (Asynchronous programming) allows a single CPU thread to handle thousands of tasks concurrently. Instead of blocking the thread while waiting for slow operations (like Network or Disk I/O), the thread yields control, allowing other tasks to make progress.
:::

## The Master Chef

:::mental-model
The Master Chef
Think of a CPU thread as a Chef in a kitchen.
Think of a function as a recipe.

In a **Synchronous** kitchen, the Chef puts a pot of water on the stove and stares at it for 10 minutes until it boils. They refuse to do anything else. The restaurant goes bankrupt.

In an **Asynchronous** kitchen, the Chef puts water on the stove, realizes it will take time, and instantly pivots to chopping onions for another dish. Then they throw a pizza in the oven. While the pizza bakes, they pivot back to the boiling water to drop the pasta in. 

One single Async Chef can juggle 50 dishes at once by never, ever wasting time staring at a wall.
:::

:::story
Imagine your DNS Gateway receives a query for `amazon.com`. It doesn't have the answer in the cache, so it has to send a network request to Google's `8.8.8.8` server to ask.

It will take 20 milliseconds for Google to reply. In CPU time, 20 milliseconds is an eternity. 

If your Gateway is synchronous, the entire server freezes. No other packets can be processed. 
If your Gateway is `async`, it sends the request to Google, tags the task as "waiting", and immediately pivots to answer the next 100 incoming DNS queries from other users. When Google's answer finally arrives, the Gateway pivots back to finish the original task.
:::

## How the Machine Sees It

Async Rust does not rely on heavy Operating System threads. It uses tiny, incredibly fast constructs called **Futures** and **State Machines**.

:::cpu
Step 1: When you call an `async fn`, the CPU does *not* execute the function immediately! Instead, it instantly returns a lightweight object called a `Future`. (Think of this as a "Promise" that the work will be done eventually).
Step 2: Behind the scenes, the Rust compiler violently shreds your `async` function into a State Machine. Every time you wait for something (like a network response), that is a state boundary.
Step 3: An "Executor" (which we will learn about in Chapter 22) polls this State Machine. It asks: "Are you done yet?"
Step 4: If the network hasn't responded, the State Machine returns `Pending`. The Executor instantly moves on to poll a different task.
Step 5: When the network responds, the State Machine advances to the next state, resuming the code exactly where it left off.
:::

## Writing Async Code

To define an asynchronous function, you simply put the word `async` in front of `fn`.

```rust
// This is a synchronous function. It blocks.
fn read_file_sync() {
    println!("Reading...");
    // If this takes 5 seconds, the whole thread freezes here!
}

// This is an asynchronous function. It returns a Future!
async fn read_file_async() {
    println!("Reading...");
    // If this takes 5 seconds, it will yield control to the Chef!
}

fn main() {
    // If we call the async function normally, NOTHING HAPPENS!
    // It just returns an invisible Future object.
    let my_future = read_file_async(); 
    
    // To actually make the Chef cook the recipe, we have to tell 
    // the system to execute the Future. (We learn how to do this next chapter).
}
```

## How We Use This in Reality

In the Kinetic project, `async` is the only reason our server can handle 100,000 queries per second on a single CPU core without melting.

:::kinetic
Every single incoming UDP packet in Kinetic is spawned as an independent asynchronous task. 

```rust
// Our main packet handler is marked as async!
async fn handle_packet(packet: DnsPacket) {
    let domain = packet.get_query_name();
    
    // If this requires querying the slow internet, it yields!
    // The main server loop is instantly freed up to accept the next packet.
    resolve_domain_remotely(domain).await; 
}
```

If we receive a massive DDoS attack of 50,000 packets per second, we don't spawn 50,000 OS threads (which would crash the Linux kernel). We just spawn 50,000 lightweight Futures on a single thread. The Executor juggles them effortlessly.
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
What does `my_future` actually contain in this code?

```rust
async fn fetch_data() -> String {
    String::from("Hello")
}

fn main() {
    let my_future = fetch_data();
}
```

*(Hint: Does `my_future` contain the String "Hello"? NO! Because `fetch_data` is an `async fn`, it instantly returns a `Future` object—a state machine that hasn't even started running yet. To actually get the string, we have to `await` the Future!)*
:::

:::remember
An `async` function does not run immediately. It returns a `Future` (a state machine). This allows a single CPU thread (the Chef) to juggle thousands of tasks concurrently by yielding control whenever a task needs to wait for slow I/O, completely eliminating thread-blocking.
:::
