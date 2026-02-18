import unittest
from math_solver import MathSolver

mee2 = """
# Flashcard 1
/fb1
y + 1 = z
/fe1

# Flashcard 2
y #=
/c/fb2
x + 1
/fe2
"""
mee2r = r"99"


def wrap(input):
    return (
        "% DO NOT EDIT MANUALLY - USE MATH SOLVER PLUGIN\n"
        + r"\\{\normalsize \begin{aligned}"
        + input
        + r"\end{aligned}}"
    )


class TestMathSolver(unittest.TestCase):
    maxDiff = None

    mathSolver = MathSolver()

    def compute(self, *args, **kwargs):
        result = self.mathSolver.compute(*args, **kwargs)
        return result["latex"]

    def test_met1(self):
        math = "eq1: (15 + x)/3  | *3"
        latex = r"&\frac{15 + x}{3} \quad |{\small \verb◊ *3◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea1(self):
        math = "x^2 + sqrt(9)"
        latex = r"&x^{2} + \sqrt{9}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea2(self):
        math = "x^2 + sqrt(9) ="
        latex = r"&x^{2} + \sqrt{9} = 3 + x^{2}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea3(self):
        math = "5^2 + sqrt(9) ="
        latex = r"&5^{2} + \sqrt{9} = 28"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea4(self):
        math = "x^2 + sqrt(9) #="
        latex = r"&x^{2} + \sqrt{9} ="
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea5(self):
        math = "x^2 + sqrt(9) = y"
        latex = r"&x^{2} + \sqrt{9} = y"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea6(self):
        math = "y = x^2 + sqrt(9)"
        latex = r"&y = x^{2} + \sqrt{9}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea7(self):
        math = "(15 + x)/3  |*3"
        latex = r"&\frac{15 + x}{3} \quad |{\small \verb◊*3◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea8(self):
        math = "(15 + x)/3  #|*3"
        latex = r"&\frac{15 + x}{3} \quad {\small \verb◊|*3◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea9(self):
        math = "(15 + x)/3  #=>*3"
        latex = r"&\frac{15 + x}{3} \quad {\small \verb◊=>*3◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea10(self):
        math = "#Test"
        latex = r"&{\small \verb◊Test◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea11(self):
        math = "# Test2"
        latex = r"&{\small \verb◊Test2◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea12(self):
        math = """
        # Some text:
        # mytext

        # Some math:
        sqrt(27) / 3

        # Some latex:
        # \\frac{1}{2}
        """
        latex = r"&{\small \verb◊Some text:◊}\\&{\small \verb◊mytext◊}\\&\\&{\small \verb◊Some math:◊}\\&\frac{\sqrt{27}}{3}\\&\\&{\small \verb◊Some latex:◊}\\&{\small \verb◊\frac{1}{2}◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mea13(self):
        math = "5"
        latex = r"&5"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mec1(self):
        math = """
        x = 10 + 5 - y
        x =
        y = 2
        x =
        """
        latex = r"&x = 10 + 5 - y\\&x = 15 - y\\&y = 2\\&x = 13"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mec2(self):
        math = """
        ex: (x^2 + sqrt(9)) / y
        y = 2

        # Expression:
        ex

        z = ex
        z =
        """
        latex = r"&\frac{x^{2} + \sqrt{9}}{y}\\&y = 2\\&\\&{\small \verb◊Expression:◊}\\&\frac{x^{2} + \sqrt{9}}{y}\\&\\&z = \frac{x^{2} + \sqrt{9}}{y}\\&z = \frac{3 + x^{2}}{2}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mec3(self):
        math = """
        x = 10
        x = 10
        x =
        """
        latex = r"&x = 10\\&x = 10\\&x = 10"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mec4(self):
        math = """
        x = 10
        x := 15
        x =
        """
        latex = r"&x = 10\\&x = 15\\&x = 15"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_mec5(self):
        math = """
        x = 10
        x #= 15
        x =
        """
        latex = r"&x = 10\\&x = 15\\&x = 10"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_med1(self):
        math = """
        eq_1: (6 * x) / y = z
        y = 18
        solve(eq_1, x)
        """
        latex = r"&\frac{6 x}{y} = z\\&y = 18\\&x = 3 z"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_med2(self):
        math = """
        ex_1: a + (6 * x) / y
        y = 18
        solve(ex_1, x)
        """
        latex = r"&a + \frac{6 x}{y}\\&y = 18\\&x = - 3 a"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_med3(self):
        math = """
        ex_1: (x^2 + sqrt(9))/y
        ex_1
        """
        latex = r"&\frac{x^{2} + \sqrt{9}}{y}\\&\frac{x^{2} + \sqrt{9}}{y}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_med4(self):
        math = """
        eq_1: 10 = (x^2)/y
        solve(eq_1, x)
        """
        latex = r"&10 = \frac{x^{2}}{y}\\&x = \left[ - \sqrt{10} \sqrt{y}, \  \sqrt{10} \sqrt{y}\right]"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_med5(self):
        math = """
        eq_1: (x^2)/y = 10
        solve(eq_1, x)
        """
        latex = r"&\frac{x^{2}}{y} = 10\\&x = \left[ - \sqrt{10} \sqrt{y}, \  \sqrt{10} \sqrt{y}\right]"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_med6(self):
        math = """
        eq_1: 2*c + m = 17
        eq_2: c + 2*m = 8
        solve([eq_1, eq_2], (c, m))
        """
        latex = r"&2 c + m = 17\\&c + 2 m = 8\\&c = \frac{26}{3}\\&m = - \frac{1}{3}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_med7(self):
        math = """
        eq_1: 2*c + m = x
        eq_2: c + 2*m = 8
        x = 10
        solve([eq_1, eq_2], (c, m))
        c =
        m =
        x := 20
        solve([eq_1, eq_2], (c, m))
        c =
        m =
        """
        latex = r"&2 c + m = x\\&c + 2 m = 8\\&x = 10\\&c = 4\\&m = 2\\&c = 4\\&m = 2\\&x = 20\\&c = \frac{32}{3}\\&m = - \frac{4}{3}\\&c = \varnothing\\&m = \varnothing"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_med8(self):
        math = """
        eq_1: x + 2 = y
        m #= solve(eq_1, x)
        """
        latex = r"&x + 2 = y\\&m = \left[ -2 + y\right]"
        self.assertEqual(self.compute(math), wrap(latex), "Inital failed.")

    def test_med9(self):
        math = """
        eq_1: a + 2 * b = 8
        eq_2: 2 * a + b = 7
        solve([eq_1, eq_2], (a))
        """
        latex = r"&a + 2 b = 8\\&2 a + b = 7\\&a = \varnothing"
        self.assertEqual(self.compute(math), wrap(latex), "Inital failed.")

    def test_mee1(self):
        math = """
        # Some text above
        # =
        /c >
        x + 1
        # Some text below
        """
        latex = r"&{\small \verb◊Some text above◊}\\&{\small \verb◊=◊} > x + 1\\&{\small \verb◊Some text below◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital failed.")

    def test_mee2(self):
        math = """
        # Line 1

        # Line 3
        """
        latex = r"&{\small \verb◊Line 1◊}\\&\\&{\small \verb◊Line 3◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital failed.")

    def test_mee3(self):
        math = """
        # Visible
        /hi
        # Hidden
        # Visible again
        """
        latex = r"&{\small \verb◊Visible◊}\\&{\small \verb◊Visible again◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital failed.")

    def test_mee4(self):
        math = """
        /la
        \\frac{1}{2}
        sqrt(9) + 5 =

        /beginlatex
        \\frac{2}{4}
        \\frac{4}{8}
        /endlatex

        sqrt(9) + 4 =
        """
        latex = r"&\frac{1}{2}\\&\sqrt{9} + 5 = 8\\&\\&\frac{2}{4}\\&\frac{4}{8}\\&\\&\sqrt{9} + 4 = 7"
        self.assertEqual(self.compute(math), wrap(latex), "Inital failed.")

    def test_mef1(self):
        math = "5 + x = 10  |-5"
        latex = (
            "% DO NOT EDIT MANUALLY - USE MATH SOLVER PLUGIN\n"
            + r"\\{\large \begin{aligned}&5 + x = 10 \quad |{\small \verb◊-5◊}\end{aligned}}"
        )
        self.assertEqual(self.compute(math, size="LARGE"), latex, "Inital failed.")

    def test_mef2(self):
        math = "5 + x = 10  |-5"
        latex = (
            "% DO NOT EDIT MANUALLY - USE MATH SOLVER PLUGIN\n"
            + r"\\{\normalsize \begin{aligned}&x + 5 = 10 \quad |{\small \verb◊-5◊}\end{aligned}}"
        )
        self.assertEqual(
            self.compute(math, order="LEX"),
            latex,
            "Inital failed.",
        )

    def test_mef3(self):
        mathPrevious = """x = 15
        y = 10
        z = x + y
        z =
        """
        math = """a = 100
        b = z + a
        b =
        """
        latex = r"&a = 100\\&b = z + a\\&b = 125"
        self.assertEqual(
            self.compute(math, previous=mathPrevious),
            wrap(latex),
            "Inital failed.",
        )

    # ===== FUNCTION DEFINITION TESTS =====

    def test_function_def1(self):
        """Basic function definition"""
        math = "f(x) = x^2 + 1"
        latex = r"&f{\left(x \right)} = x^{2} + 1"
        self.assertEqual(
            self.compute(math), wrap(latex), "Basic function definition failed."
        )

    def test_function_def2(self):
        """Multi-parameter function definition"""
        math = "g(x, y) = x*sin(y) + cos(x)"
        latex = (
            r"&g{\left(x, y \right)} = x \sin{\left(y \right)} + \cos{\left(x \right)}"
        )
        self.assertEqual(
            self.compute(math),
            wrap(latex),
            "Multi-parameter function definition failed.",
        )

    def test_function_call1(self):
        """Function call in expression (should not expand)"""
        math = """
        f(x) = x^2 + 1
        15 - f(x) + 2
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&15 - f{\left(x \right)} + 2"
        self.assertEqual(
            self.compute(math), wrap(latex), "Function call in expression failed."
        )

    def test_function_eval1(self):
        """Function evaluation with equals"""
        math = """
        f(x) = x^2 + 1
        f(3) =
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&f{\left(3 \right)} = 10"
        self.assertEqual(self.compute(math), wrap(latex), "Function evaluation failed.")

    def test_function_eval2(self):
        """Function evaluation with symbolic parameter"""
        math = """
        f(x) = 2*x + 1
        y = 5
        f(y) =
        """
        latex = r"&f{\left(x \right)} = 2 x + 1\\&y = 5\\&f{\left(y \right)} = 11"
        self.assertEqual(
            self.compute(math), wrap(latex), "Function evaluation with variable failed."
        )

    def test_function_composition1(self):
        """Function composition"""
        math = """
        f(x) = x^2 + 1
        g(x) = 2*x
        h(x) = f(g(x))
        h(2) =
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&g{\left(x \right)} = 2 x\\&h{\left(x \right)} = f{\left(g{\left(x \right)} \right)}\\&h{\left(2 \right)} = 17"
        self.assertEqual(
            self.compute(math), wrap(latex), "Function composition failed."
        )

    def test_function_equation1(self):
        """Function equation storage"""
        math = """
        f(x) = x^2 + 1
        g(x) = 2*x
        eq1: f(x) = g(x)
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&g{\left(x \right)} = 2 x\\&f{\left(x \right)} = g{\left(x \right)}"
        self.assertEqual(
            self.compute(math), wrap(latex), "Function equation storage failed."
        )

    def test_function_solve1(self):
        """Solve with functions"""
        math = """
        f(x) = x^2 - 4
        solve(f(x), x)
        """
        latex = r"&f{\left(x \right)} = x^{2} - 4\\&x = \left[ -2, \  2\right]"
        self.assertEqual(
            self.compute(math), wrap(latex), "Solve with functions failed."
        )

    def test_function_arithmetic1(self):
        """Arithmetic with function calls"""
        math = """
        f(x) = x^2 + 1
        g(x) = 2*x
        f(x) + g(x)
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&g{\left(x \right)} = 2 x\\&f{\left(x \right)} + g{\left(x \right)}"
        self.assertEqual(self.compute(math), wrap(latex), "Function arithmetic failed.")

    def test_function_arithmetic2(self):
        """Arithmetic with evaluated function calls"""
        math = """
        f(x) = x^2 + 1
        g(x) = 2*x
        f(2) + g(3) =
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&g{\left(x \right)} = 2 x\\&f{\left(2 \right)} + g{\left(3 \right)} = 11"
        self.assertEqual(
            self.compute(math), wrap(latex), "Function arithmetic evaluation failed."
        )

    def test_function_nested1(self):
        """Nested function calls"""
        math = """
        f(x) = x^2 + 1
        g(x) = 2*x
        f(g(2)) =
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&g{\left(x \right)} = 2 x\\&f{\left(g{\left(2 \right)} \right)} = 17"
        self.assertEqual(
            self.compute(math), wrap(latex), "Nested function calls failed."
        )

    def test_function_mixed1(self):
        """Mixed variables and functions"""
        math = """
        f(x) = x^2 + a
        a = 5
        f(3) =
        """
        latex = r"&f{\left(x \right)} = x^{2} + a\\&a = 5\\&f{\left(3 \right)} = 14"
        self.assertEqual(
            self.compute(math), wrap(latex), "Mixed variables and functions failed."
        )

    def test_function_redefinition1(self):
        """Function redefinition with :="""
        math = """
        f(x) = x^2 + 1
        f(x) := 2*x
        f(3) =
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&f{\left(x \right)} = 2 x\\&f{\left(3 \right)} = 6"
        self.assertEqual(
            self.compute(math), wrap(latex), "Function redefinition failed."
        )

    def test_function_comment1(self):
        """Function comment assignment should not overwrite definition"""
        math = """
        f(x) = x^2 + 1
        f(x) #= 2*x
        f(3) =
        """
        latex = r"&f{\left(x \right)} = x^{2} + 1\\&f{\left(x \right)} = 2 x\\&f{\left(3 \right)} = 10"
        self.assertEqual(
            self.compute(math), wrap(latex), "Function comment evaluation failed."
        )

    # ===== LATEX FUNCTION TESTS =====

    def test_latex_with_string(self):
        math = r"""
        /beginpython
        x = "5"
        text("hey " + x)
        latex("\\frac{1}{2}")
        text("the end")
        /endpython
        """
        latex = r"&{\small \verb◊hey 5◊}\\&\frac{1}{2}\\&{\small \verb◊the end◊}"
        self.assertEqual(self.compute(math), wrap(latex), "Inital test.")

    def test_latex_with_sympy_expr(self):
        """Test latex() with SymPy expression"""
        math = r"""
        /beginpython
        x = sympy.Symbol('x')
        expr = x**2 + sympy.sqrt(9)
        latex(expr)
        /endpython
        """
        latex = r"&3 + x^{2}"
        self.assertEqual(
            self.compute(math), wrap(latex), "LaTeX with SymPy expression failed."
        )

    def test_latex_with_equation(self):
        """Test latex() with SymPy equation"""
        math = r"""
        /beginpython
        x, y = sympy.symbols('x y')
        eq = sympy.Eq(x**2, y + 1)
        latex(eq)
        /endpython
        """
        latex = r"&x^{2} = 1 + y"
        self.assertEqual(self.compute(math), wrap(latex), "LaTeX with equation failed.")

    def test_latex_with_number(self):
        """Test latex() with number"""
        math = r"""
        /beginpython
        latex(42)
        /endpython
        """
        latex = r"&42"
        self.assertEqual(self.compute(math), wrap(latex), "LaTeX with number failed.")

    def test_latex_mixed_types(self):
        """Test latex() with mixed types"""
        math = r"""
        /beginpython
        x = sympy.Symbol('x')
        expr = x**2 + 5
        latex("First expression:")
        latex(expr)
        latex("Result: 42")
        /endpython
        """
        latex = r"&First expression:\\&5 + x^{2}\\&Result: 42"
        self.assertEqual(
            self.compute(math), wrap(latex), "LaTeX with mixed types failed."
        )

    def test_latex_with_functions(self):
        """Test latex() with SymPy functions"""
        math = r"""
        /beginpython
        x = sympy.Symbol('x')
        expr = sympy.sin(x) + sympy.cos(x**2)
        latex(expr)
        /endpython
        """
        latex = r"&\cos{\left(x^{2} \right)} + \sin{\left(x \right)}"
        self.assertEqual(
            self.compute(math), wrap(latex), "LaTeX with functions failed."
        )

    # ===== SETSYMBOL AND SETFUNCTION TESTS =====

    def test_setSymbol_basic(self):
        """Test setSymbol to define a symbol from Python"""
        math = r"""
        /beginpython
        setSymbol("a", 5)
        /endpython
        a + 2 =
        """
        latex = r"&a + 2 = 7"
        self.assertEqual(self.compute(math), wrap(latex), "setSymbol basic failed.")

    def test_setSymbol_expression(self):
        """Test setSymbol with SymPy expression using external symbol"""
        math = r"""
        a = 5
        /beginpython
        x = sympy.Symbol('x')
        # Access symbol 'a' defined outside Python block
        a_value = ctx["symbols"]["a"]
        expr = x**2 + 3*x + a_value
        setSymbol("myExpr", expr)
        /endpython
        myExpr =
        """
        latex = r"&a = 5\\&myExpr = 5 + x^{2} + 3 x"
        self.assertEqual(
            self.compute(math), wrap(latex), "setSymbol with expression failed."
        )

    def test_setFunction_basic(self):
        """Test setFunction to define a function from Python"""
        math = r"""
        /beginpython
        x = sympy.Symbol('x')
        args = (x,)
        expr = x**2 + 1
        setFunction("myFunc", args, expr)
        /endpython
        myFunc(3) =
        """
        latex = r"&\operatorname{myFunc}{\left(3 \right)} = 10"
        self.assertEqual(self.compute(math), wrap(latex), "setFunction basic failed.")

    def test_setFunction_multi_param(self):
        """Test setFunction with multiple parameters"""
        math = r"""
        /beginpython
        x, y = sympy.symbols('x y')
        args = (x, y)
        expr = x*y + x + y
        setFunction("multiFunc", args, expr)
        /endpython
        multiFunc(2, 3) =
        """
        latex = r"&\operatorname{multiFunc}{\left(2,3 \right)} = 11"
        self.assertEqual(
            self.compute(math), wrap(latex), "setFunction multi-parameter failed."
        )

    # ===== PLOTTING TESTS =====

    def test_plot_basic(self):
        """Test basic 2D plotting"""
        math = "plot(x^2, (x, -2, 2))"
        result = self.mathSolver.compute(math)

        # Check that latex output is empty (plots don't generate latex)
        self.assertEqual(result["latex"], "")

        # Check that plots array has one plot
        self.assertEqual(len(result["plots"]), 1)

        # Check plot structure
        plot = result["plots"][0]
        self.assertEqual(plot["type"], "2d")
        self.assertIn("data", plot)
        self.assertIn("title", plot)
        self.assertTrue(plot["data"])  # Should have base64 data

    def test_plot_with_function(self):
        """Test plotting with defined function"""
        math = """
        f(x) = x^2 - 4
        plot(f(x), (x, -3, 3))
        """
        result = self.mathSolver.compute(math)

        # Should have the function definition but no plot latex
        self.assertIn("f{\\left(x \\right)} = x^{2} - 4", result["latex"])
        self.assertNotIn("Plot generated", result["latex"])

        # Should have one plot
        self.assertEqual(len(result["plots"]), 1)

    """def test_plot_save_to_file(self):
        import base64
        
        math = "plot(sin(x), (x, -6, 6))"
        result = self.mathSolver.compute(math)
        
        # Should have generated a plot
        self.assertEqual(len(result["plots"]), 1)
        
        plot = result["plots"][0]
        self.assertEqual(plot["type"], "2d")
        self.assertTrue(plot["data"])
        
        # Decode base64 and save to file
        image_data = base64.b64decode(plot["data"])
        
        # Save to file in current directory
        with open("test_plot_output.png", "wb") as f:
            f.write(image_data)
        
        print(f"Plot saved to test_plot_output.png (size: {len(image_data)} bytes)")
        
        # Verify file was created and has content
        import os
        self.assertTrue(os.path.exists("test_plot_output.png"))
        self.assertGreater(os.path.getsize("test_plot_output.png"), 1000)  # Should be at least 1KB
    """

    def test_plot_with_ylim(self):
        """Test plotting with y-axis limits"""
        math = "plot(x^2, (x, -2, 2), ylim=(-1, 5))"
        result = self.mathSolver.compute(math)

        # Should have generated a plot
        self.assertEqual(len(result["plots"]), 1)
        self.assertNotIn("Plot generated", result["latex"])

        plot = result["plots"][0]
        self.assertEqual(plot["type"], "2d")
        self.assertTrue(plot["data"])

    def test_plot_with_multiple_kwargs(self):
        """Test plotting with multiple SymPy plot options"""
        math = 'plot(sin(x), (x, -6, 6), ylim=(-2, 2), title="Sine Wave", xlabel="x", ylabel="sin(x)")'
        result = self.mathSolver.compute(math)

        # Should have generated a plot
        self.assertEqual(len(result["plots"]), 1)
        # Check that latex output is empty (plots don't generate latex)
        self.assertEqual(result["latex"], "")

        plot = result["plots"][0]
        self.assertEqual(plot["type"], "2d")
        self.assertTrue(plot["data"])

    # Practical Tests

    def test_electric_cuircit_1(self):
        math = """U_1 = 50
        R_1 = 10
        R_2 = 15
        R_3 = 20
        R_4 = 18

        G_1: I_2 = I_1 + I_3
        G_2: U_1 = R_1 * I_1 + R_4 * I_1 + R_2 * I_2
        G_3: 0 = R_2 * I_2 + R3 * I_3

        solve([G_1,G_2,G_3], (I_1, I_2, I_3))
        """

        latex = r"&U_{1} = 50\\&R_{1} = 10\\&R_{2} = 15\\&R_{3} = 20\\&R_{4} = 18\\&\\&I_{2} = I_{1} + I_{3}\\&U_{1} = R_{1} I_{1} + R_{4} I_{1} + R_{2} I_{2}\\&0 = R_{2} I_{2} + R_{3} I_{3}\\&\\&I_1 = \frac{750 + 50 R_{3}}{420 + 43 R_{3}}\\&I_2 = \frac{50 R_{3}}{420 + 43 R_{3}}\\&I_3 = - \frac{750}{420 + 43 R_{3}}"
        self.assertEqual(self.compute(math), wrap(latex), "Test failed.")


if __name__ == "__main__":
    unittest.main()


## TODO Later
# o think := vs =:
# o graph
# o table
# o maybe print
# o maybe eval
# o bold and double underline
