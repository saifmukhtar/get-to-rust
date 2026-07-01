# Chapter 14: Result (Error Handling without Exceptions)

Operations fail. Networks drop, hard drives crash, and files go missing. 

In Java, Python, or C#, when an operation fails, the program throws an "Exception". Exceptions are invisible bombs. They fly up the call stack, blowing up functions one by one, until some `catch` block intercepts them. If no one intercepts them, the entire application dies.

Because Exceptions are invisible in the function's signature, developers constantly forget to handle them.

Rust refuses to use Exceptions. Instead, Rust treats errors as *just another type of data* that you must explicitly handle.

:::definition
`Result` is a built-in Enum used for operations that can fail. It forces the caller to explicitly handle the success variant (`Ok`) or the failure variant (`Err`) before they are legally allowed to use the data.
:::

## Certified Mail

:::mental-model
Certified Mail
Think of a `Result` as a Certified Mail package.
When you ask the post office to deliver a letter, they don't just silently lose it if they can't find the address (like C). Nor do they throw a brick through your window (like Java Exceptions).

Instead, they hand you a sealed, certified box.
When you unlock the box (using `match`), you will find exactly one of two things inside:
1. Your requested item (`Ok`).
2. An official, highly detailed letter explaining exactly why the operation failed (`Err`).

You are legally required to sign for the box and open it before you can proceed.
:::

:::story
Imagine you tell the operating system: "Please read the configuration file on my hard drive."

In Python, you assume it works. You try to read the file. But the file doesn't exist. Python throws a `FileNotFoundError` Exception, your server crashes, and your users are furious.

In Rust, the operating system hands you a `Result<File, Error>`. The compiler says, "I see you want to read this file. First, you must open the `Result` box. Tell me exactly what you will do if it is `Ok(File)`, AND tell me exactly what you will do if it is `Err(FileNotFound)`."
:::

## How the Machine Sees It

Just like `Option`, `Result` is a standard Enum provided by the Rust standard library.

:::cpu
Step 1: The CPU executes a risky operation (like binding a network socket).
Step 2: The OS returns an exit code. 
Step 3: If the exit code is 0 (Success), Rust wraps the socket in the `Ok` variant. If the exit code is 1 (Failure), Rust wraps an Error object in the `Err` variant.
Step 4: Your `match` statement checks the variant tag. There is no "unwinding the stack" or hidden invisible jumps like Exceptions. It's just a hyper-fast, standard `if/else` check at the CPU level.
:::

## Using Result in Practice

Here is the actual definition of `Result` hidden in the standard library. Notice it takes two Types (`T` for the success type, `E` for the error type).

```rust
// You do not need to write this. Rust provides this globally!
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Let's look at how a developer is forced to interact with it:

```rust
// A fake function that attempts to connect to a server.
// It returns either a String (Success) or a u16 Error Code (Failure).
fn connect_to_server() -> Result<String, u16> {
    let success = false;
    
    if success {
        Ok(String::from("Connected to 10.0.0.1!"))
    } else {
        Err(503) // 503 Service Unavailable
    }
}

fn main() {
    let connection_box = connect_to_server();

    // We CANNOT use the connection yet! We must unlock it:
    match connection_box {
        Ok(message) => println!("Great success: {}", message),
        Err(code) => println!("Failed with error code: {}. Retrying...", code),
    }
}
```

## How We Use This in Reality

In the Kinetic project, `Result` is how we guarantee our server never crashes when hit by garbage data from the internet.

:::kinetic
When our Gateway receives a raw array of bytes over UDP, it attempts to parse those bytes into a structured `DnsPacket`. This parsing operation is highly dangerous. What if a hacker sent malformed bytes?

```rust
// The parse function returns a Result!
fn parse_dns(bytes: &[u8]) -> Result<DnsPacket, ParseError> {
    // ... complex parsing logic ...
}

// In our main server loop, we are FORCED to handle hackers safely:
let parse_result = parse_dns(incoming_bytes);

match parse_result {
    Ok(packet) => {
        // The bytes were safe. We can now process the packet.
        process(packet);
    }
    Err(error) => {
        // The bytes were malformed! We log the error and drop the packet.
        // The server stays alive! No exceptions thrown!
        println!("Received garbage bytes: {:?}", error);
    }
}
```
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
Will this code compile?

```rust
fn open_port() -> Result<u16, String> {
    Ok(53)
}

fn main() {
    let my_port = open_port();
    
    // Attempting to print the port directly!
    println!("Listening on port: {}", my_port);
}
```

*(Hint: `my_port` is not a `u16`! It is a `Result<u16, String>`! You cannot print a sealed Certified Mail package! The compiler will throw an error demanding you use `match` to unwrap the `Ok` variant before you can print the number 53.)*
:::

:::remember
Rust does not use invisible Exceptions. It uses the `Result` Enum to force developers to explicitly handle both the `Ok` and `Err` outcomes of a dangerous operation. This completely eliminates unpredictable crashes.
:::
