# Math Solver Syntax Guide

## What is Math Solver?

A tool that converts math expressions into beautifully formatted LaTeX while performing calculations. Write math naturally, get formatted output automatically.

## Quick Start

### Usage

Type `/Add math solver` on a new rem to add the math solver. Click the calculator button to open the editor, enter your expression, and press <kbd>Shift</kbd> + <kbd>Enter</kbd> or the accept button to calculate.

### Write Math Expressions

Just type math like you normally would:

```
x + 5
y = (15 + x)/3
```

### Calculate Results

Add `=` at the end to calculate:

```
5^2 + sqrt(9) =        →  5² + √9 = 28
10 * 5 - 2 =           →  10 × 5 - 2 = 48
```

### Use Variables

Store and use values:

```
x = 10
y = 5
x + y =                →  x + y = 15
```

## Core Features

### 1. Mathematical Functions

We use the python library SymPy behind the scenes, which means you can use most SymPy functions:

- `sqrt(25)` → √25
- `sin(x)`, `cos(x)`, `tan(x)` → trigonometric functions
- `log(x)` → natural logarithm
- `exp(x)` → exponential (e^x)
- `abs(x)` → absolute value |x|
- `factorial(n)` → n!
- `diff(expr, x)` → derivative with respect to x
- `integrate(expr, x)` → integral with respect to x
- you can find more in the offical SymPy documentation: [SymPy API Docs](https://docs.sympy.org/latest/reference/public/basics/index.html#basic-modules)

### 2. Working with Equations

**Standard Equation** (`=`)

```
y = x^2 + 3
```

**Calculate Current Value** (end with `=`)

```
x = 10
y = 5
x + y =                →  x + y = 15
```

**Force New Value** (`:=`)

```
x = 10                 →  x = 10
x := 20                →  x = 20  (overrides previous value)
```

**Display Only** (`#=`)

```
x = 10                 →  x = 10
x #= 99                →  x = 99  (shows but doesn't save)
x =                    →  x = 10  (still 10)
```

### 3. Solving Equations

**Label equations** with `name:` then solve them:

Simple equation:

```
eq1: x + 5 = 10
solve(eq1, x)          →  x = 5
```

System of equations:

```
eq1: 2*x + y = 10
eq2: x - y = 2
solve([eq1, eq2], (x, y))  →  x = 4, y = 2
```

Solve with functions:

```
f(x) = x^2 - 4
solve(f(x), x)         →  x = [-2, 2]
```

### 4. Function Definitions

**Define custom functions** using the `f(parameters) = expression` syntax:

Single parameter:

```
f(x) = x^2 + 1         →  f(x) = x² + 1
f(3) =                 →  f(3) = 10
```

Multiple parameters:

```
g(x, y) = x*sin(y) + cos(x)  →  g(x,y) = x⋅sin(y) + cos(x)
g(2, pi/2) =                 →  g(2, π/2) = 3
```

Function composition:

```
f(x) = x^2 + 1
g(x) = 2*x
h(x) = f(g(x))         →  h(x) = f(g(x))
h(3) =                 →  h(3) = 37
```

Function redefinition:

```
f(x) = x^2
f(x) := 2*x            →  Force overwrite function
f(x) #= x + 1          →  Display only (doesn't save)
```

### 5. Adding Comments

**Full line comments:**

```
# This is a title
x + 5 = 10
# This explains the result
```

**End-of-line comments:**

write two spaces followed by `|` or `#`

```
x + 5 = 10  | -5       →  x + 5 = 10  |-5  (operation hint)
x + 5 = 10  # note     →  x + 5 = 10  # note (general comment)
```

### 6. Plotting Graphs

**Create visual graphs** using the `plot()` function:

**Basic plotting:**

```
plot(x^2, (x, -5, 5))          →  Plots y = x² from x = -5 to x = 5
plot(sin(x), (x, 0, 2*pi))     →  Plots sine function from 0 to 2π
```

**Multiple functions on one plot:**

```
plot([sin(x), cos(x)], (x, 0, 2*pi))  →  Plots both sine and cosine
plot([x^2, x^3], (x, -2, 2))          →  Plots both quadratic and cubic
```

**Using functions:**

```
f(x) = 2*x^2 + 3*x - 1
plot(f(x), (x, -3, 3))         →  Plots your custom function
```

**Plot with styling options:**

```
plot(x^3 - 2*x, (x, -3, 3), title="Cubic Function", xlabel="x values", ylabel="f(x)")
```

**Advanced plotting options:**

```
# Custom colors and labels
plot(sin(x), (x, 0, 2*pi), line_color="red", label="sine wave")

# Set axis limits and scaling
plot(exp(x), (x, -2, 2), xlim=(-2, 2), ylim=(0, 10), yscale="log")

# Multiple expressions with individual ranges
plot((x^2, (x, -3, 3)), (2*x, (x, -1, 1)))

# High-resolution plotting
plot(sin(10*x), (x, 0, pi), n=1000)

# Custom plot size
plot(x^2, (x, -5, 5), size=(8, 6))
```

**Common plot parameters:**

- `title="Plot Title"` - Set the plot title
- `xlabel="X Label"`, `ylabel="Y Label"` - Axis labels
- `line_color="red"` - Line color (red, blue, green, etc.)
- `xlim=(min, max)`, `ylim=(min, max)` - Axis limits
- `xscale="log"`, `yscale="log"` - Logarithmic scaling
- `n=500` - Number of sample points (higher = smoother)
- `size=(width, height)` - Plot size in inches

**Graph features:**

- Click the graph button 📊 after calculation to view plots
- Copy or download graphs and insert them in a new rem for permanent storage
- Switch between light and dark themes

## Special Modes

### Raw LaTeX

Insert one line of LaTeX:

```
/la
\frac{a+b}{2} \geq \sqrt{ab}
```

Insert multi line LaTeX block:

```
/beginlatex
\frac{a+b}{2} \geq \sqrt{ab}
\text{Arithmetic Mean} \geq \text{Geometric Mean}
/endlatex
```

### Python Code

Run Python code for complex calculations and interact with the math context:

```
/beginpython
for i in range(3):
    text(f"Step {i}")
    latex(f"x_{i} = {i**2}")
/endpython
```

Output:

```
Step 0
x₀ = 0
Step 1
x₁ = 1
Step 2
x₂ = 4
```

#### Available Functions in Python Blocks

**Output Functions:**

- `text(string)` - Display text output
- `latex(expression)` - Display mathematical expressions (auto-converts SymPy objects to LaTeX)

**Context Interaction:**

- `setSymbol(name, value)` - Define/update a symbol in the math context
- `setFunction(name, args, expression)` - Define/update a function in the math context
- `ctx["symbols"][name]` - Access existing symbols from the math context
- `ctx["functions"][name]` - Access existing functions from the math context

**Built-in Libraries:**

- `sympy` - Full SymPy library for symbolic mathematics

#### Examples

**Basic Output:**

```
/beginpython
text("Computing area...")
radius = 5
area = 3.14159 * radius**2
latex(f"\\text{{Area}} = {area}")
/endpython
```

**Smart LaTeX Conversion:**

```
/beginpython
x = sympy.Symbol('x')

# latex() automatically detects SymPy objects
expr = sympy.sin(x)**2 + sympy.cos(x)**2
latex(expr)                →  sin²(x) + cos²(x)

# Also works with strings
latex("\\frac{1}{2}")     →  ½
/endpython
```

## Formatting Commands

- `//` - Hidden comment (won't appear in output)
- `/hi` - Hide the next line
- `/c` - Connect to previous line:
  ```
  # The answer
  /c is:
  x + 5                →  The answer is: x + 5
  ```

## Common Workflows

### Basic Calculation

```
# Calculate area of circle
radius = 5
area = 3.14159 * radius^2
area =                 →  area = 78.54
```

### Step-by-Step Solution

```
# Solve: 2x + 6 = 14
2*x + 6 = 14  | -6
2*x = 8       | /2
x = 4
```

## Options

In the first line you can configure options.

```
large ordered
x = 4 + y - 6
```

- **large**: increase text size
- **ordered**: put math expressions in Lexicographic order

## Tips & Tricks

1. **Blank lines** are preserved for better visual organization
2. **Subscripts** - use underscore for subscript notation: `eq_1`, `x_0`, `a_n` → eq₁, x₀, aₙ
3. **Fractions** are automatically formatted: `(x+1)/(y+2)` becomes a proper fraction
4. **Exponents** - you can use `**` instead of `^` (for example, `x**2` = `x^2`)
