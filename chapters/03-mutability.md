# Chapter 3: Mutability

If variables are boxes that hold data, it seems obvious that we should be able to open those boxes later and swap the data inside for something else. If the score in a game changes, you update the score variable, right?

But allowing everything in memory to change at any random time is the root cause of almost every critical bug, security vulnerability, and crash in modern software. 

If two separate parts of a program try to edit the exact same box at the exact same millisecond, the data corrupts. This is called a *race condition*, and it is the nightmare of every systems engineer.

Rust takes a radical stance on this problem. It fundamentally distrusts change. 

:::definition
Mutability is the explicit permission to alter the data stored at a specific memory location. By default, all variables in Rust are immutable (read-only).
:::

## The Contract and The Draft

:::mental-model
Reading a Book vs. Editing a Google Doc
Think of an immutable variable like a printed, published book. You can read it as many times as you want, and you can share it with millions of people simultaneously. It is perfectly safe because no one can change the text.
A mutable variable is like a shared Google Doc with edit permissions enabled. It's powerful, but if 100 people try to type over the same paragraph at once, chaos ensues.
:::

:::story
Imagine you sign a binding legal contract (an immutable variable). Once the ink is dry, that contract cannot be altered. If you want to change a clause, you cannot just cross it out with a pen. You must explicitly draft an entirely new, editable version of the document (a mutable variable). 

In Rust, the compiler enforces this legally binding contract. If you try to change a read-only variable, the compiler rips the pen out of your hand and stops the program from even compiling.
:::

## How the Machine Sees It

When you ask the CPU to update a variable, the compiler performs a strict background check before the binary code is even generated.

:::cpu
Step 1: The CPU encounters an instruction attempting to overwrite the value of a variable `x`.
Step 2: The Rust Compiler intercepts this action. It checks its internal ledger: "Did the programmer explicitly attach the `mut` flag when they created `x`?"
Step 3: If the flag is missing, the compiler throws a fatal error and refuses to generate the executable binary. The program never even reaches the CPU.
Step 4: If the flag exists, the CPU physically overwrites the bytes in memory with the new data.
:::

:::memory
Address: `0x7ffee943a120`
Name: `active_peers`
Mutable: `False` (Locked)
Value: `42` -> *Attempted update to `43` is Blocked!*
:::

## Writing Mutable Variables

To tell Rust that you intend to change a variable's value later, you must explicitly use the `mut` (mutable) keyword.

```rust
let mut active_peers = 10;
active_peers = 11; // Perfectly legal!
```

Without the `mut` keyword, the following code will fail to compile:

```rust
let active_peers = 10;
// active_peers = 11; // ❌ ERROR: cannot assign twice to immutable variable
```

## How We Use This in Reality

In a highly concurrent system, knowing exactly what is allowed to change and what is locked down is the key to preventing crashes.

:::kinetic
In the Kinetic project, imagine we are reading a raw byte stream from an incoming UDP `Packet` on the network. We need a temporary `Buffer` to store these bytes as they trickle in.

Because bytes are constantly arriving and being appended to this buffer, the buffer *must* be allowed to change its internal state.

```rust
// We explicitly declare the buffer as mutable
let mut packet_buffer = Vec::new();

// We can safely append new bytes as they arrive
packet_buffer.push(255);
packet_buffer.push(10);
```

If we forgot the `mut` keyword, the compiler would stop us from pushing bytes into the buffer, saving us from a logic error.
:::

## The Golden Rule of Change

:::warning
Variables are read-only by default to save you from yourself.

If you don't need to change a variable, do not make it mutable. The compiler uses this immutability guarantee to violently optimize your code to run faster, knowing that the value will never unpredictably shift under its feet.
:::

## Test Your Intuition

:::challenge
Become the CPU. 
Can you change the *type* of a mutable variable?

```rust
let mut peer_count = 10;
peer_count = "Ten"; 
```

*(Hint: Remember Chapter 2! `mut` gives you permission to change the data inside the box, but it does NOT let you change the physical size or blueprint of the shipping container itself. The compiler will reject this code because "Ten" is a String, not an Integer!)*
:::

:::remember
Rust defaults to immutability to prevent data corruption. If you want to change a value, you must explicitly demand permission by using the `mut` keyword.
:::
