# Chapter 22: Tokio

We know that `async` creates a Master Chef capable of cooking 50 dishes at once. We know that `.await` is how the Chef sets a timer and pivots to the next task.

But here is the strangest secret in the Rust programming language: **Rust does not include an engine to actually run async code.**

The Rust standard library gives you the `Future` trait, the `async` keyword, and the `.await` keyword. But if you try to run an async `main()` function with just the standard library, it will not work. Rust provides the syntax, but it intentionally leaves out the "Executor"—the engine that actually polls the Futures and manages the CPU threads.

Why? Because different programs need different engines. A tiny microchip controlling a pacemaker needs a completely different async engine than a massive 128-core web server. Rust lets you choose the engine that fits your project.

For 99% of network applications, the community has rallied behind one supreme, ultra-fast engine: **Tokio**.

:::definition
Tokio is an external, asynchronous runtime (an Executor) for Rust. It provides the event loop that schedules tasks, polls Futures, and handles the low-level operating system I/O (like network sockets and timers).
:::

## The Restaurant Manager

:::mental-model
The Restaurant Manager
Think of `async` and `.await` as the recipes and the Chefs. 
But a restaurant cannot run on Chefs alone. Who assigns the incoming orders to the Chefs? Who watches the delivery drivers? Who wakes up a Chef when the oven timer goes off?

Tokio is the Restaurant Manager.
Tokio sits at the front of the house. When a customer (network packet) arrives, Tokio takes the order and assigns it to an available Chef. When a Chef hits an `.await` and yields, Tokio remembers where they left off and assigns them a new task. When a network response finally arrives, Tokio is the one who taps the Chef on the shoulder and says, "Resume task #42."
:::

:::story
If you write an `async` program without Tokio, it is like having a fully staffed kitchen with no manager. The Chefs stand around holding recipes (Futures), but nobody ever tells them to start cooking.

When you bring Tokio into your project, you are hiring a hyper-efficient manager that instantly starts an "Event Loop"—a continuous cycle that checks for new network traffic, polls pending Futures, and keeps the CPU cores running at 100% efficiency.
:::

## How the Machine Sees It

Tokio is a highly optimized Event Loop, built on top of the fastest features of your Operating System (like `epoll` on Linux or `kqueue` on macOS).

:::cpu
Step 1: You tag your main function with `#[tokio::main]`. This is a macro (a piece of code that writes more code).
Step 2: Behind the scenes, the macro wraps your `main` function in a massive `while` loop provided by the Tokio library.
Step 3: This `while` loop (the Executor) constantly asks the Operating System: "Did any network packets arrive? Did any timers go off?"
Step 4: If the OS says "Yes, socket 5 has data," Tokio looks up which suspended `Future` was waiting for socket 5, and immediately calls `resume()` on it.
Step 5: Tokio manages a pool of CPU threads, automatically stealing work from busy threads and giving it to idle threads to ensure perfect load balancing.
:::

## Using Tokio

To use Tokio, you must add it to your `Cargo.toml` dependencies file.

```toml
[dependencies]
# We import tokio and enable all of its features (networking, macros, timers)
tokio = { version = "1", features = ["full"] }
```

Then, you simply tag your `main` function. Because Tokio is managing the event loop, your `main` function is now allowed to be `async`!

```rust
// 1. We tell the Restaurant Manager to take over the main function!
#[tokio::main]
async fn main() {
    println!("Tokio is now running the event loop!");

    // 2. Because main is async, we can now use .await!
    let data = fetch_from_database().await;
    
    println!("Data fetched: {}", data);
}

async fn fetch_from_database() -> String {
    // 3. We can use Tokio's built-in async timers instead of blocking the thread!
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    
    String::from("User Profile")
}
```

## How We Use This in Reality

In the Kinetic project, Tokio is the beating heart of the entire application.

:::kinetic
When you look at `src/main.rs` in the Kinetic codebase, the very first thing you will see is `#[tokio::main]`.

Instead of using the standard library's `std::net::UdpSocket` (which blocks the thread), Kinetic uses `tokio::net::UdpSocket`.

```rust
use tokio::net::UdpSocket;

#[tokio::main]
async fn main() {
    // This socket is non-blocking! 
    let socket = UdpSocket::bind("0.0.0.0:53").await.unwrap();
    let mut buffer = vec![0; 512];

    loop {
        // When we call recv_from, if there is no packet, the thread doesn't freeze!
        // Tokio pauses this loop and goes to do other background tasks.
        // The instant a packet arrives, Tokio wakes this loop back up.
        let (size, client) = socket.recv_from(&mut buffer).await.unwrap();
        
        println!("Received {} bytes from {}", size, client);
    }
}
```

Because of Tokio, that `loop` can handle tens of thousands of packets a second without ever dropping a single one or freezing the CPU.
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
What happens if you delete `#[tokio::main]` from the top of an async program?

```rust
// I forgot the Tokio macro!
async fn main() {
    println!("Hello, world!");
}
```

*(Hint: The compiler will throw a massive error! It will say: "`main` function is not allowed to be `async`". The Rust compiler knows that without an Executor like Tokio to manage the event loop, an async main function is impossible to run. You must hire the Restaurant Manager!)*
:::

:::remember
Rust provides the `async` and `.await` syntax, but it does not provide the engine to run them. **Tokio** is the external runtime (the Executor) that manages the event loop, schedules the Futures, and interacts with the operating system's non-blocking network stack.
:::
