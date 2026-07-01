# Chapter 17: Traits (Interfaces)

We now know how to build custom data (Structs) and attach specific behavior to it (Impl Blocks). 

But what if multiple, completely different Structs share the *same* behavior?

Imagine you have a `UdpSocket` struct and a `TcpSocket` struct. They are totally different under the hood. However, they both have a `.send()` method. 

If you want to write a `broadcast_message()` function, how do you tell the compiler to accept *either* socket? If you write `fn broadcast(socket: UdpSocket)`, the compiler will reject the `TcpSocket`.

Object-Oriented languages solve this with "Inheritance" (forcing both sockets to inherit from a master `BaseSocket` class). This leads to massive, rigid, deeply-nested class hierarchies that are famously terrible to maintain.

Rust solves this elegantly with **Traits**.

:::definition
A Trait is a way to define shared behavior abstractly. It allows you to tell the compiler: "I don't care what this Struct is, as long as it guarantees it has these specific methods attached to it."
:::

## The Job Description and The Contract

:::mental-model
The Job Description
Think of a Trait as a strict Job Description for an open position at a company (e.g., "Driver").
The Job Description doesn't care about your physical makeup. It doesn't care if you are an F1 Champion, a teenager, or an autonomous robot. It only cares about one thing: Can you perform the required actions?

If you want the job, you must sign a Contract (`impl Trait for Struct`). By signing, you legally guarantee that you have bolted a `steer()` method and a `brake()` method onto your personal instruction manual.
Once you sign the contract, the company will hire you as a generic "Driver".
:::

:::story
Imagine you are building a logging system. You have a `ConsoleLogger` struct and a `FileLogger` struct.

You define a Trait called `Loggable`. The trait says: "To sign this contract, you must provide a `.write_log()` method."

Both structs sign the contract and write their own custom version of the `.write_log()` method.

Now, you can write a main function that accepts an array of `Loggable` objects. The function loops through the array, calling `.write_log()` on each one. The function has absolutely no idea if it is writing to the console or to a file. It doesn't care. It only cares that they signed the contract.
:::

## How the Machine Sees It

Traits allow the CPU to perform "Polymorphism" (treating different objects as the same generic type).

:::cpu
Step 1: When you write a function that takes a generic Trait (e.g., `fn send_data(socket: impl SocketTrait)`), the compiler actually uses **Monomorphization**.
Step 2: During compilation, the compiler looks at everywhere you called that function.
Step 3: If you passed a `UdpSocket` on line 10, and a `TcpSocket` on line 20, the compiler silently copy-pastes the `send_data` function twice. It creates one perfectly optimized version for UDP, and one perfectly optimized version for TCP.
Step 4: At runtime, there is zero performance penalty. The CPU runs direct, hardcoded machine instructions for the specific struct type.
:::

## Defining and Implementing Traits

Let's write the Job Description (the `trait`) and then have a Struct sign the contract (`impl Trait for Struct`).

```rust
// 1. The Job Description
// We define a Trait with a single required method signature.
trait Alertable {
    fn sound_alarm(&self);
}

// 2. We have a basic Struct
struct Server {
    ip: String,
}

// 3. The Struct SIGNS THE CONTRACT!
impl Alertable for Server {
    // The compiler forces us to provide the actual logic for the required method
    fn sound_alarm(&self) {
        println!("BEEP BEEP! Server {} is down!", self.ip);
    }
}

// 4. A function that accepts ANY struct, as long as it signed the contract!
// Notice the `impl Alertable` syntax in the argument!
fn trigger_emergency(target: &impl Alertable) {
    target.sound_alarm();
}

fn main() {
    let my_server = Server { ip: String::from("10.0.0.1") };
    
    // We can pass our server because it signed the Alertable contract!
    trigger_emergency(&my_server);
}
```

## How We Use This in Reality

In the Kinetic project, Traits are how we keep our core networking loop completely decoupled from the specific protocols.

:::kinetic
Kinetic needs to be able to resolve DNS queries using multiple strategies (e.g., checking a local Cache, checking a static Hosts file, or querying the global Internet).

We define a `Resolver` trait:
```rust
trait Resolver {
    fn resolve(&self, domain: &str) -> Option<String>;
}
```

We build three completely different structs: `Cache`, `HostsFile`, and `UpstreamQuery`. They all `impl Resolver for ...`.

Now, our Gateway can hold a simple `Vec<Box<dyn Resolver>>` (a list of objects that signed the contract). When a query arrives, the Gateway simply loops through the list, calling `.resolve()` on each one until one of them finds the answer. The Gateway doesn't know *how* they are resolving the query, it just trusts the contract!
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
Will this code compile?

```rust
trait Flyable {
    fn fly(&self);
}

struct Bird { name: String }

impl Flyable for Bird {
    // I forgot to write the fly() method here!
}

fn main() {
    let tweety = Bird { name: String::from("Tweety") };
}
```

*(Hint: You cannot sign a contract and then refuse to do the work! The compiler will halt and throw an error: "not all trait items implemented, missing: `fly`".)*
:::

:::remember
A Trait is a contract defining shared behavior. Instead of using messy inheritance hierarchies, Rust allows completely different Structs to implement the same Trait. This allows you to write clean, generic functions that accept any object, as long as it guarantees it can perform the required methods.
:::
