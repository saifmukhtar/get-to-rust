# Chapter 16: Impl Blocks (Methods)

In Chapter 11, we learned how to group related data together into a `Struct`. 
For example, a `Packet` struct might contain an IP address and a payload of bytes.

But data is useless without behavior. We need functions to parse that packet, validate it, or send it.

In older languages like C, Data and Behavior are completely disconnected. You define a Struct, and then somewhere else in a massive file, you define a function that takes that Struct as an argument: `parse_packet(&my_packet)`. This gets messy quickly.

Object-Oriented languages (Java, C++) attempted to fix this by inventing "Classes", which forcefully fuse Data and Behavior together, along with rigid inheritance hierarchies.

Rust rejects both extremes. Rust keeps Data (`struct`) and Behavior (`impl`) logically separated in the code, but allows you to attach the behavior directly to the Data Type.

:::definition
An `impl` (implementation) block allows you to attach functions directly to a Struct or Enum. When a function is attached to an instance of a struct, it is called a **Method**. When it is attached to the struct blueprint itself, it is called an **Associated Function**.
:::

## The Instruction Manual

:::mental-model
The Bolted Instruction Manual
Think of a Struct as the physical shipping crate containing your data.
Think of an `impl` block as an instruction manual that you physically bolt onto the side of that crate.

Whenever someone receives the crate, they don't have to go searching the warehouse for a separate rulebook on how to use it. They simply look at the side of the crate (using the dot `.` operator) and read the manual. The crate carries its own capabilities.
:::

:::story
Imagine you build a custom `DnsGateway` struct. It holds configuration data.
You want to turn it on.
Instead of passing it to a disconnected function like `start_gateway(&gateway)`, you bolt a `start()` method directly to the Gateway blueprint. 

Now, you just say `gateway.start()`. The data knows how to operate itself.
:::

## How the Machine Sees It

At the CPU level, Methods do not actually exist! They are a syntactic illusion provided by the compiler to make your life easier.

:::cpu
Step 1: You write `gateway.start()`.
Step 2: The Rust compiler intercepts this and silently transforms it into `DnsGateway::start(&gateway)`. 
Step 3: The CPU executes a standard, disconnected function call, passing a memory pointer (`&`) to the struct as the very first argument.

Methods have absolutely zero runtime overhead compared to standard functions. It is pure syntactic sugar for human readability.
:::

## Writing Impl Blocks

To bolt behavior onto a struct, you use the `impl` keyword followed by the name of the struct.

There are two types of functions you can put inside an `impl` block:
1. **Methods**: Functions that take `&self` (a reference to the specific crate instance).
2. **Associated Functions**: Functions that DO NOT take `&self` (used to build brand new crates, like a constructor).

```rust
struct Gateway {
    port: u16,
    is_running: bool,
}

// We open an implementation block for the Gateway
impl Gateway {
    
    // 1. ASSOCIATED FUNCTION (No &self)
    // This is like a factory. It doesn't need an existing crate to work.
    // It builds a brand new crate and returns it. (Often called 'new')
    fn new(custom_port: u16) -> Gateway {
        Gateway {
            port: custom_port,
            is_running: false,
        }
    }

    // 2. METHOD (Takes &mut self)
    // This function requires an existing crate to operate on.
    // It takes a mutable reference to 'itself' so it can change its own data.
    fn start(&mut self) {
        self.is_running = true;
        println!("Gateway started on port {}", self.port);
    }
}
```

Let's see how a developer actually uses this manual:

```rust
fn main() {
    // We use the Associated Function (Factory) to build the struct.
    // Notice the double colon `::` syntax!
    let mut my_gateway = Gateway::new(53);

    // We use the Method to operate on the struct instance.
    // Notice the dot `.` syntax!
    my_gateway.start(); 
}
```

## How We Use This in Reality

In the Kinetic project, `impl` blocks are how we organize the thousands of lines of logic required to parse binary network packets.

:::kinetic
When a raw UDP payload arrives, it's just a `Vec<u8>`. We immediately wrap it in a `DnsPacket` struct.

We don't want the Gateway's main loop cluttered with byte-shifting logic. So, we hide all of that complexity inside an `impl` block attached directly to the `DnsPacket`.

```rust
struct DnsPacket {
    raw_bytes: Vec<u8>
}

impl DnsPacket {
    // A method to extract just the Query ID
    fn get_transaction_id(&self) -> u16 {
        // Complex byte shifting hidden here!
        (self.raw_bytes[0] as u16) << 8 | (self.raw_bytes[1] as u16)
    }
}

// In our main loop, the code is beautifully clean:
let id = packet.get_transaction_id();
println!("Processing DNS Query: {}", id);
```
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
Look at the following `impl` block. Is `validate()` an Associated Function, or a Method?

```rust
struct Token {
    key: String
}

impl Token {
    fn validate(token_string: String) -> bool {
        token_string.len() > 10
    }
}
```

*(Hint: Look at the arguments! Does `validate` take `&self` as its first argument? No! Therefore, it is an Associated Function. You would call it using `Token::validate("my_string")`, NOT `my_token.validate()`!)*
:::

:::remember
An `impl` block bolts behavior (an instruction manual) directly onto a data type. Methods take `&self` and operate on instances using the `.` operator. Associated functions do not take `&self` and are used as constructors via the `::` operator.
:::
