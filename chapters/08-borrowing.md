# Chapter 8: Borrowing

Ownership is a brilliant solution to memory management, but it introduces a very frustrating problem.

If passing a variable into a function destroys your ownership of it (a Move), how are you supposed to write useful code? Imagine you have a massive list of IP addresses, and you just want a function to calculate the length of the list. 

If you pass the list to the `calculate_length()` function, that function takes ownership, calculates the length, and then destroys your list when it finishes! You can never use your list again.

To fix this, you *could* have the function return the length *and* return the list back to you. But passing ownership back and forth hundreds of times is exhausting and ugly. 

There must be a way to let a function *look* at data without *stealing* it.

:::definition
Borrowing allows you to create a temporary reference to a value without taking ownership of it. A reference is denoted by the ampersand `&` symbol.
:::

## Loaning a Masterpiece

:::mental-model
The Museum Loan
Think of a complex Heap variable (like a `Packet` or a `String`) as an incredibly valuable painting that you legally own. 
If a museum (a function) wants to display your painting, you do not sign over the legal deed of ownership to them. That would be insane.
Instead, you let them *borrow* the painting. You give them a temporary exhibit contract (a Reference). They can look at it and show it to people, but they cannot destroy it, and they cannot keep it. When the exhibit is over, the painting safely returns to your vault.
:::

:::story
Imagine you own a massive container on the warehouse floor (the Heap). You have the master key (Ownership). 

A new worker (a function) needs to audit the contents of the container. Instead of giving them the master key (which transfers ownership), you give them a temporary guest pass (a Reference). 

The worker takes the guest pass, walks to the warehouse floor, and looks inside the container. When the worker finishes their shift and clocks out (the function ends), they throw away their guest pass. The container remains completely untouched, and you still hold the master key.
:::

## How the Machine Sees It

When you create a reference `&`, you are actually creating a pointer that points to another pointer. 

:::cpu
Step 1: The CPU allocates a `String` on the Heap. The master pointer lives in Variable A on the Stack.
Step 2: You create a reference `&A` and pass it to a function.
Step 3: The CPU creates a *new* tiny pointer on the Stack for the function. This tiny pointer does not point to the Heap. It points to Variable A on the Stack!
Step 4: The function finishes. The CPU destroys the tiny pointer.
Step 5: Variable A remains perfectly intact and still legally owns the Heap data.
:::

:::memory
--- THE HEAP ---
Address: `0x8000` 
Value: `"Kinetic"`

--- THE STACK ---
Variable A (Owner): `0x8000` -> *(Still valid!)*
Variable B (Reference): `Points to Variable A` -> *(Destroyed when function ends)*
:::

## Writing References

In Rust, you create a reference by putting an `&` in front of a variable. 

```rust
let original_string = String::from("Kinetic");

// We create a Reference (guest pass) and pass it to the function
let len = calculate_length(&original_string);

// ✅ PERFECTLY FINE! We never lost ownership!
println!("The string {} has length {}", original_string, len); 

// The function must explicitly accept a Reference (&String)
fn calculate_length(s: &String) -> usize {
    s.len()
}
```

Notice that the function signature `fn calculate_length(s: &String)` uses the `&`. This is a strict contract. The function is publicly announcing: "I only want a guest pass. I refuse to take ownership."

## How We Use This in Reality

In the Kinetic project, borrowing is how we pass massive network payloads around the system at lightning speed without ever copying data or losing ownership.

:::kinetic
Imagine our Gateway receives a UDP `Packet`. We need to pass this packet to three different validation functions: `check_checksum()`, `check_rate_limit()`, and `check_blacklist()`.

If we didn't have borrowing, the first function would steal ownership of the `Packet` and destroy it!

```rust
let packet = Packet::new(raw_bytes);

// We hand out three temporary guest passes!
let is_valid = check_checksum(&packet);
let is_safe = check_rate_limit(&packet);
let is_allowed = check_blacklist(&packet);

// We still own the packet and can now route it!
route_packet(packet);
```
Because we passed `&packet`, the validation functions just looked at the bytes in memory and returned a true/false answer. The original `Packet` remained safely owned by the main loop the entire time.
:::

## The Golden Rule of Immutability

:::warning
A standard borrow `&` is completely read-only.

If you give a museum a painting, they can look at it, but they cannot take out a paintbrush and change the colors. 

If you pass a `&String` to a function, and that function tries to append text to it, the compiler will instantly throw a fatal error. You only gave them permission to look!
:::

## Test Your Intuition

:::challenge
Become the CPU. 
Look at the following code. Will this compile?

```rust
fn print_peer(peer: &String) {
    println!("Peer IP: {}", peer);
}

fn main() {
    let current_peer = String::from("192.168.1.1"); 
    print_peer(&current_peer); 
    print_peer(&current_peer); 
    print_peer(&current_peer); 
}
```

*(Hint: Yes! Because `print_peer` only takes a reference (`&`), it never takes ownership. You can hand out as many read-only guest passes as you want, as many times as you want!)*
:::

:::remember
Borrowing `&` allows a function to look at your data without taking ownership. It is a temporary, read-only guest pass. When the function ends, the guest pass is destroyed, and you still own the data.
:::
