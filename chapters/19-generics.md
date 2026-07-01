# Chapter 19: Generics

Imagine you write a function to sort a list of numbers (`Vec<i32>`). It works perfectly. 

Tomorrow, your boss asks you to sort a list of IP addresses (`Vec<String>`). Do you copy and paste the entire sorting function, just changing the word `i32` to `String`? What if you need to sort 50 different data types? Copying and pasting code is how bugs multiply and codebases rot.

We need a way to write a function or a struct *once*, and let the compiler figure out the specific data types later.

:::definition
Generics allow you to write abstract, reusable code by using a placeholder type (usually `<T>`). You define the logic once, and the compiler automatically generates the specific, concrete versions of the code for every type you end up using.
:::

## The Blank Blueprint

:::mental-model
The Blank Blueprint
Think of a Generic Struct as a blank blueprint for a shipping crate.
Instead of specifying "This slot must hold a Steel Engine," the blueprint simply says "This slot will hold *Something* (Type `<T>`)."

When the factory (the compiler) actually goes to build the crate, it looks at what you are trying to put inside. If you put a Steel Engine in, the factory automatically generates a custom "Steel Crate" blueprint. If you put a Wood Chair in, the factory generates a "Wood Crate" blueprint.

You only drew one blank blueprint, but the factory did all the hard work to make it specific.
:::

:::story
Think back to Chapter 13 (`Option`) and Chapter 14 (`Result`).

The Rust creators didn't write an `OptionForStrings`, an `OptionForNumbers`, and an `OptionForBooleans`. They wrote a single, generic `Option<T>` enum. 

When you type `Option<String>`, you are filling in the blank `<T>` blueprint with a concrete `String`. The compiler then silently builds a custom `OptionForStrings` just for you behind the scenes.
:::

## How the Machine Sees It

Generics in Rust do not have any runtime performance penalty. They are 100% a compile-time feature.

:::cpu
Step 1: You write a generic function `fn print_item<T>(item: T)`.
Step 2: The compiler looks through your entire codebase to see how you used this function.
Step 3: It sees you called it with an `i32` on line 10, and a `String` on line 20.
Step 4: **Monomorphization**. The compiler silently copy-pastes your function twice. It creates `print_item_for_i32` and `print_item_for_string`. 
Step 5: When the CPU runs the code, there are no "generic" types. The CPU runs highly optimized, hardcoded instructions for the specific types. You get the abstraction of Python with the raw speed of C.
:::

## Writing Generic Code

To tell Rust that a function or struct is generic, you must declare the placeholder `<T>` right after the name. (You can use any letter, but `T` for "Type" is standard).

### Generic Structs

```rust
// We declare <T> to say: "This struct will hold some generic Type T"
struct PayloadBox<T> {
    data: T,
}

fn main() {
    // The compiler sees we put a string inside.
    // It silently creates a PayloadBoxForString blueprint.
    let string_box = PayloadBox { data: String::from("Hello") };

    // The compiler sees an integer.
    // It silently creates a PayloadBoxForI32 blueprint.
    let int_box = PayloadBox { data: 42 };
}
```

### Generic Functions

```rust
// We declare <T> after the function name to announce we are using a generic.
// Then we use T as the type for the argument!
fn log_anything<T: std::fmt::Debug>(item: T) {
    println!("Logging: {:?}", item);
}

fn main() {
    log_anything(500); // Works with numbers!
    log_anything("Network Error"); // Works with strings!
}
```
*(Note: The `: std::fmt::Debug` part is called a Trait Bound. It tells the compiler: "This generic `T` can be anything, as long as it has signed the `Debug` contract so I know how to print it!" Chapter 17 strikes again!)*

## How We Use This in Reality

In the Kinetic project, generics are the secret to keeping our codebase clean and small.

:::kinetic
Imagine our caching system. We don't just cache DNS records. Sometimes we want to cache IP blocklists, or configuration settings.

Instead of writing three different Cache structs, we write one generic `Cache<T>`:

```rust
struct Cache<T> {
    items: Vec<T>,
}

impl<T> Cache<T> {
    fn add_item(&mut self, item: T) {
        self.items.push(item);
    }
}
```

Now, the Gateway can create a `Cache<DnsRecord>` and the Firewall module can create a `Cache<BlockRule>`. We only wrote the caching logic once, but the compiler generates two perfectly optimized, perfectly safe systems for us.
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
Will this code compile?

```rust
struct Pair<T> {
    first: T,
    second: T,
}

fn main() {
    let my_pair = Pair {
        first: 10,
        second: "Hello",
    };
}
```

*(Hint: Look at the generic definition! We used a single `<T>`. This means `first` and `second` must be the EXACT SAME TYPE! In `main()`, we tried to pass an integer for `first` and a String for `second`. The compiler will throw an error: "expected integer, found `&str`". If we wanted two different types, we would have to define a struct with two generic placeholders, like `struct Pair<T, U>`!)*
:::

:::remember
Generics (`<T>`) allow you to write reusable code by delaying the choice of a specific data type. The compiler does the heavy lifting via Monomorphization, silently generating highly optimized, specific code for every type you end up using, resulting in zero runtime overhead.
:::
