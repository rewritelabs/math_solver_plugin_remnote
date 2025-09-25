export default ((s: any) => s.raw)`
import re
import ast
import sympy
from sympy.parsing.sympy_parser import (
    standard_transformations,
    convert_equals_signs,
    convert_xor,
)
from sympy.printing.latex import LatexPrinter
import numbers
import base64
import io


class MathSolver:
    def __init__(self):
        # Create instances of the printer
        self.custom_printer = CustomLatexPrinter(settings={"order": "none"})
        self.custom_printer_ordered = CustomLatexPrinter(settings={"order": "lex"})

    def compute(
        self,
        mathSolverExpression,
        size="NORMAL",
        order="NONE",
        theme="LIGHT",
        previous=None,
    ):
        env = {
            "options": {
                "size": "large" if size == "LARGE" else "normalsize",
                "order": order,
                "theme": theme,
            },
            "symbols": {},
            "functions": {},
            "internalVariables": {},
            "symbolExpressions": {},
            "relatedSymbols": {},
            "symbolErrors": {},
            "generalErrors": [],
            "plots": [],
        }

        if previous and isinstance(previous, str):
            processInput(self, previous, env)

        result = processInput(self, mathSolverExpression, env)
        return {
            "latex": result,
            "symbolErrors": env["symbolErrors"],
            "plots": env["plots"],
        }

    def convertToLatex(self, input, order="NONE"):
        if order == "LEX":
            return self.custom_printer_ordered.doprint(input)
        else:
            return self.custom_printer.doprint(input)

    @staticmethod
    def syntaxError(string, errorMsg):
        return 'Invalid: "' + string + '" ' + errorMsg


def processInput(self, mathSolverExpression, env):
    ctx = {
        "mode": "MATH",  # or "PYTHON" or "LATEX"
        "equationType": "NONE",  # or "NORMAL" or "FORCED" or "COMMENT"
        "modifieres": set(),  # ["CONNECTSTART", "CONNECTEND", "HIDE", "LATEXLINE", "FLASHCARD"]
        "flashcardNumber": 0,
        "pythonLines": [],
        **env,
    }

    lines = mathSolverExpression.splitlines()

    if not lines[0].strip():
        lines.pop(0)

    if not lines[-1].strip():
        lines.pop()

    latexLines = []
    for line in lines:

        if "LATEXLINE" in ctx["modifieres"]:
            ctx["modifieres"].remove("LATEXLINE")
            latexLines.append("&" + line.strip())
        else:
            result = processLine(
                self,
                ctx,
                line.strip(),
            )
            if not result is None:
                if "HIDE" in ctx["modifieres"]:
                    ctx["modifieres"].remove("HIDE")
                elif "CONNECTSTART" in ctx["modifieres"]:
                    latexLines[-1] = latexLines[-1] + result
                    ctx["modifieres"].remove("CONNECTSTART")
                    ctx["modifieres"].add("CONNECTEND")
                elif "CONNECTEND" in ctx["modifieres"]:
                    latexLines[-1] = latexLines[-1] + result
                    ctx["modifieres"].remove("CONNECTEND")
                else:
                    latexLines.append("&" + result)

    if len(latexLines):
        joinedString = r"\\".join(latexLines)
        finalString = (
            "% DO NOT EDIT MANUALLY - USE MATH SOLVER PLUGIN\n"
            + "\\\\{\\"
            + ctx["options"]["size"]
            + r" \begin{aligned}"
            + joinedString
            + r"\end{aligned}}"
        )

        return finalString
    else:
        return ""


def processLine(self, ctx, line):
    # Resets
    ctx["internalVariable"] = None
    ctx["equationType"] = "NORMAL"

    if ctx["mode"] == "MATH":
        if not line:
            return r""
        if line.startswith("//"):
            return None
        elif line.startswith("/"):
            if line.startswith("/beginpython"):
                ctx["mode"] = "PYTHON"
                ctx["pythonLines"] = []
                return None
            elif line.startswith("/beginlatex"):
                ctx["mode"] = "LATEX"
                return None
            elif line.startswith("/c"):
                ctx["modifieres"].add("CONNECTSTART")
                argument = line[2:].strip()
                if argument:
                    return " " + argument + " "
                else:
                    return " "
            elif line.startswith("/hi"):
                ctx["modifieres"].add("HIDE")
                return None
            elif line.startswith("/la"):
                ctx["modifieres"].add("LATEXLINE")
                return None

        elif line.startswith("#"):
            # return r"\text{" + line[1:].strip() + r"}"
            return r"{\small \verb◊" + line[1:].strip() + r"◊}"
        else:
            try:
                result = processMath(
                    self,
                    ctx,
                    line,
                )
                return result
            except Exception as error:
                # raise
                return self.syntaxError(line, "Invalid syntax in line.")
    elif ctx["mode"] == "PYTHON":
        if line.startswith("/endpython"):
            ctx["mode"] = "MATH"
            userScript = "\n    ".join(ctx["pythonLines"])

            internalPython1 = """
_mathsolver_context_ = {
    "prints": [], "updatedSymbols": {}, "updatedFunctions": {}, "error": None
}

def latex(input):
    # Check if input is a SymPy object
    if hasattr(input, '__module__') and input.__module__ and 'sympy' in input.__module__:
        # It's a SymPy object, convert to LaTeX
        latex_str = custom_latex_printer.doprint(input)
    elif isinstance(input, str):
        # Assume it's already LaTeX or plain text
        latex_str = input
    else:
        # For other types, convert to string
        latex_str = str(input)
    
    _mathsolver_context_["prints"].append(
        {"type": "LATEX", "value": latex_str}
    )

def text(input):
    _mathsolver_context_["prints"].append(
        {"type": "TEXT", "value": str(input)}
    )

def setSymbol(name, expr):
    ctx["symbols"][name] = expr
    _mathsolver_context_["updatedSymbols"][name] = expr

def setFunction(name, args, expr):
    ctx["functions"][name] = sympy.Lambda(args, expr)
    _mathsolver_context_["updatedFunctions"][name] = sympy.Lambda(args, expr)

def _mathsolver_user_script_():
"""

            internalPython2 = """

try:
    _mathsolver_user_script_()
except Exception as error:
    stringError = str(error)
    _mathsolver_context_["error"] = stringError
"""

            pythonScript = internalPython1 + f"    {userScript}" + internalPython2

            namespace = {
                "ctx": ctx.copy(),
                "sympy": sympy,
                "custom_latex_printer": CustomLatexPrinter(settings={"order": "none"}),
            }

            exec(pythonScript, namespace)
            msContext = namespace.get("_mathsolver_context_")

            stringArray = []

            for printObj in msContext["prints"]:
                # Skip empty values
                if not printObj["value"] or not printObj["value"].strip():
                    continue

                if printObj["type"] == "TEXT":
                    stringArray.append(r"&{\small \verb◊" + printObj["value"] + r"◊}")
                else:
                    stringArray.append(r"&" + printObj["value"])

            if len(stringArray) == 0:
                return None

            stringArray[0] = stringArray[0][1:]
            finalString = r"\\".join(stringArray)

            updatedSymbols = msContext["updatedSymbols"]
            if len(updatedSymbols.keys()) > 0:
                for symbolName, symbolExpr in updatedSymbols.items():
                    storeSymbol(self, ctx, symbolName, symbolExpr, "FORCED")

            updatedFunctions = msContext["updatedFunctions"]
            if len(updatedFunctions.keys()) > 0:
                for functionName, lambdaExpr in updatedFunctions.items():
                    ctx["functions"][functionName] = lambdaExpr

            return finalString
        else:
            ctx["pythonLines"].append(line)
    elif ctx["mode"] == "LATEX":
        if line.startswith("/endlatex"):
            ctx["mode"] = "MATH"
            return None
        else:
            return line


def processMath(
    self,
    ctx,
    line,
):
    # Extract End Comment
    endComment = ""
    isLineComment = line.find("  |") >= 0
    isHashComment = line.find("  #") >= 0
    bothExist = isLineComment and isHashComment
    parts = re.split(r"  [|#]", line)
    if len(parts) > 2 or bothExist:
        return self.syntaxError(line, "You can't have multiple comments.")
    elif len(parts) == 2:
        firstPart = parts[0]
        endComment = parts[1]
    else:
        firstPart = parts[0]

    # Extract Internal Varaible
    serachResult = re.search(r"^[\w\d]+: ", firstPart)

    if serachResult:
        ctx["internalVariable"] = serachResult.group().split(":")[0]

        mathPart = firstPart[serachResult.end() :].strip()

        parts = re.split(r"[\w\d]+: ", firstPart)
        if re.search(r"^[\w\d]+: ", mathPart):
            return self.syntaxError(
                line, "You can't have multiple internal varaible definitons."
            )
    else:
        mathPart = firstPart.strip()

    # Check equal signs (order matters - check longer patterns first)
    hasForceEqual = re.search(r":=", mathPart)
    hasCommentEqual = re.search(r"#=", mathPart)
    hasNormalEqual = (
        re.search(r"=", mathPart) and not hasForceEqual and not hasCommentEqual
    )

    if hasForceEqual:
        parts = re.split(r":=", mathPart)
        if hasCommentEqual or hasNormalEqual or len(parts) > 2 or not parts[1]:
            return self.syntaxError(line, "Invalid use of the equation sign.")

        ctx["equationType"] = "FORCED"

    elif hasCommentEqual:
        parts = re.split(r"#=", mathPart)
        if hasNormalEqual or hasForceEqual:
            return self.syntaxError(line, "Invalid use of the equation sign.")

        ctx["equationType"] = "COMMENT"

    elif hasNormalEqual:
        if len(parts) > 2:
            return self.syntaxError(line, "Invalid use of the equation sign.")

        ctx["equationType"] = "NORMAL"

    # Prossess eqations
    stringExpresssions = re.split(r":=|#=|=", mathPart)

    # Check special functions
    isFunctionCall = re.search(r"^[a-zA-z]\w*\(", mathPart)
    if isFunctionCall:
        # Match pattern: one pair of parentheses with valid content
        functionNameResult = re.match(r"^\s*([a-zA-Z]\w*)\s*\(", stringExpresssions[0])
        functionInsideResult = re.search(
            r"\s*\(\s*([a-zA-Z][\w',\s]*)\s*\)\s*$", stringExpresssions[0]
        )

        if mathPart.startswith("solve(") and mathPart.endswith(")"):
            solveResult = solveFn(self, ctx, mathPart)
            return solveResult
        elif mathPart.startswith("plot(") and mathPart.endswith(")"):
            plotResult = plotFn(self, ctx, mathPart)
            return plotResult
        elif (
            len(stringExpresssions) == 2
            and bool(functionNameResult)
            and bool(functionInsideResult)
            and bool(stringExpresssions[1])
        ):
            functionName = functionNameResult.group(1)
            functionInside = functionInsideResult.group(1)

            # Function definition
            args = [arg.strip() for arg in functionInside.split(",") if arg.strip()]

            parsed_expr = defineFunction(
                self, ctx, functionName, args, stringExpresssions[1]
            )

            argsString = ", ".join(args)
            latex = (
                functionName
                + r"{\left("
                + argsString
                + r" \right)} = "
                + self.convertToLatex(parsed_expr, ctx["options"]["order"])
            )
            return latex

    processedExpression = processExpressions(
        self,
        ctx,
        stringExpresssions,
    )

    if endComment:
        return (
            processedExpression
            + " \\quad "
            + ("|" if isLineComment else "")
            + r"{\small \verb◊"
            + endComment
            + r"◊}"
        )
    else:
        return processedExpression


def processExpressions(
    self,
    ctx,
    stringExpresssions,
):
    # Parse into sympy
    expressions = []
    for stringExpression in stringExpresssions:
        if stringExpression:
            sympyExpr = parseToSympy(self, ctx, stringExpression)
            expressions.append(sympyExpr)

    # Store declerations in env variable for following expressions
    if ctx["equationType"] == "NORMAL" or ctx["equationType"] == "FORCED":
        if len(expressions) == 2:
            if isinstance(expressions[0], sympy.core.symbol.Symbol):
                lhs = expressions[0]
                rhs = expressions[1]
            elif isinstance(expressions[1], sympy.core.symbol.Symbol):
                lhs = expressions[1]
                rhs = expressions[0]
            else:
                lhs = expressions[0]
                rhs = expressions[1]

            if isinstance(lhs, sympy.core.symbol.Symbol):
                result = storeSymbol(self, ctx, str(lhs), rhs, ctx["equationType"])

                if not result:
                    raise
                    # return r"\O"

        elif len(stringExpresssions) == 2 and not stringExpresssions[1]:
            if ctx["equationType"] == "NORMAL":

                lhs = expressions[0]
                rhs = subAndCalculate(self, ctx, lhs)
                expressions.append(rhs)
            else:
                return self.syntaxError(
                    str(expressions[0]) + " := ", "Invalid use of operator"
                )

    elif ctx["equationType"] == "COMMENT":
        if (
            len(stringExpresssions) >= 2
            and not stringExpresssions[len(stringExpresssions) - 1]
        ):
            expressions.append(None)

    # save internal Variable
    if ctx.get("internalVariable") and (
        ctx["equationType"] == "NORMAL"
        or ctx["equationType"] == "FORCED"
        or ctx["equationType"] == "NONE"
    ):
        internalVariable = ctx.get("internalVariable")
        ctx["internalVariables"][internalVariable] = (
            sympy.Eq(expressions[0], expressions[1])
            if len(expressions) == 2
            else expressions[0]
        )
        # return r"\O"

    # Produce final string
    finalStringExpressions = []
    for expr in expressions:
        if expr or expr == 0:
            latex = self.convertToLatex(expr, ctx["options"]["order"])
        else:
            if isinstance(expr, set) or isinstance(expr, sympy.sets.sets.EmptySet):
                latex = r"\varnothing"
            else:
                latex = ""
        finalStringExpressions.append(latex)

    if len(finalStringExpressions) >= 2:
        return " = ".join(finalStringExpressions).strip()
    else:
        return finalStringExpressions[0]


def storeSymbol(self, ctx, key, value, equationType):
    if equationType == "NORMAL" or equationType == "NONE":
        existingExpression = ctx["symbols"].get(key)

        if isinstance(existingExpression, set) and bool(existingExpression) == False:
            return True
        elif not existingExpression == None:
            if existingExpression == value:
                return True
            else:
                expressionsToCheck = [existingExpression]
                expressionsToCheck.extend(ctx["symbolExpressions"][key])

                allSymbols = set()
                finalExpressions = []
                scalarValues = []

                newExpr = substitute(value, ctx["symbols"])

                for expr in expressionsToCheck:
                    currentExpr = substitute(expr, ctx["symbols"])

                    if newExpr != currentExpr:
                        if isinstance(currentExpr, numbers.Number):
                            scalarValues.append(currentExpr)
                        elif isinstance(currentExpr, sympy.Basic):
                            finalExpressions.append(currentExpr)
                            symbolsList = list(currentExpr.free_symbols)
                            for sympySymbol in symbolsList:
                                allSymbols.add(str(sympySymbol))

                if isinstance(newExpr, numbers.Number):
                    scalarValues.append(newExpr)
                elif isinstance(newExpr, sympy.Basic):
                    finalExpressions.append(newExpr)
                    symbolsList = list(newExpr.free_symbols)
                    for sympySymbol in symbolsList:
                        allSymbols.add(str(sympySymbol))

                if len(scalarValues) >= 2:
                    ctx["symbols"][key] = set()
                    addSymbolError(
                        self,
                        ctx,
                        key,
                        "Symbol is assigned multiple scalar values "
                        + str(scalarValues),
                    )
                elif len(scalarValues) == 1:
                    ctx["symbols"][key] = scalarValues[0]
                    ctx["symbolExpressions"][key] = finalExpressions
                else:
                    ctx["symbols"][key] = finalExpressions[0]
                    ctx["symbolExpressions"][key] = finalExpressions[1:]

                ctx["relatedSymbols"][key] = allSymbols
                return True

        else:
            ctx["symbols"][key] = value
            ctx["symbolExpressions"][key] = []
            ctx["relatedSymbols"][key] = set()
            return True

    if equationType == "FORCED":
        ctx["symbols"][key] = value
        ctx["symbolExpressions"][key] = []
        ctx["relatedSymbols"][key] = set()
        return True


def addSymbolError(self, ctx, key, errorMsg):
    errorArray = getPath(ctx["symbolErrors"], key)
    if not errorArray:
        errorArray = ctx["symbolErrors"][key] = set()

    errorArray.add(errorMsg)


def subAndCalculate(self, ctx, expr):
    result = substitute(
        expr, {**ctx["internalVariables"], **ctx["symbols"]}, ctx["functions"]
    )
    if not isinstance(result, list):
        try:
            togetherResult = sympy.together(result)
            return togetherResult
        except Exception as error:
            pass

    return result


def substitute(input, symbolsToSub, functionsToSub={}):
    symbolsToSubstitute = {**symbolsToSub}
    functionsToSubstitute = {**functionsToSub}
    if isinstance(input, list):
        finalList = []
        for item in input:
            result = internalSubstitute(
                item, symbolsToSubstitute, functionsToSubstitute
            )
            finalList.append(result)

        return finalList

    else:
        result = internalSubstitute(input, symbolsToSubstitute, functionsToSubstitute)
        return result


def internalSubstitute(input, symbolsToSub, functionsToSub):
    if isinstance(input, sympy.core.relational.Equality):
        eqItems = list(input.args)
        lhs = eqItems[0]
        rhs = eqItems[1]
        if isinstance(lhs, sympy.core.symbol.Symbol):
            key = str(lhs)
            symbolValue = getPath(symbolsToSub, key)
            if symbolValue == rhs:
                symbolsToSub.pop(key)
        if isinstance(rhs, sympy.core.symbol.Symbol):
            key = str(rhs)
            symbolValue = getPath(symbolsToSub, key)
            if symbolValue == lhs:
                symbolsToSub.pop(key)

    for functionName, lambdaExpr in functionsToSub.items():
        original_params = lambdaExpr.args[0]
        expr = lambdaExpr.args[1]
        for innerFunctionName, innerLambdaExpr in functionsToSub.items():
            expr = expr.replace(sympy.Function(innerFunctionName), innerLambdaExpr)
        functionsToSub[functionName] = sympy.Lambda(original_params, expr)

    currentResult = input

    for functionName, lambdaExpr in functionsToSub.items():
        currentResult = currentResult.replace(sympy.Function(functionName), lambdaExpr)

    for i in range(50):
        newResult = currentResult
        if hasattr(currentResult, "subs"):
            newResult = currentResult.subs(symbolsToSub)

        if newResult == currentResult:
            if hasattr(currentResult, "doit"):
                return currentResult.doit()
            else:
                return currentResult
        else:
            currentResult = newResult

    if hasattr(currentResult, "doit"):
        return currentResult.doit()
    else:
        return currentResult


# def replaceFunctions(input, functions):


alwaysEvalFor = ["solve", "integrate", "plot"]
alwaysEvalForPatternParts = [
    r"(^|[^a-zA-Z])" + re.escape(name) + r"\(" for name in alwaysEvalFor
]
alwaysEvalForPattern = "|".join(alwaysEvalForPatternParts)


def parseToSympy(self, ctx, stringExpression, alwaysEvaluate=False):
    transformations = standard_transformations + (convert_xor,)

    evaluate = bool(re.search(alwaysEvalForPattern, stringExpression)) or alwaysEvaluate

    if evaluate:
        localDict = {**sympy.__dict__, **ctx["internalVariables"], **ctx["symbols"]}
    else:
        localDict = {
            **sympy.__dict__,
            **ctx["internalVariables"],
        }

    try:
        with sympy.evaluate(evaluate):
            expr = sympy.parse_expr(
                stringExpression,
                local_dict=localDict,
                transformations=transformations,
                evaluate=evaluate,
            )

            return expr
    except Exception as error:
        # raise
        return self.syntaxError(stringExpression, "Invalid syntax.")


def defineFunction(self, ctx, functionName, args, stringExpression):
    # Always create a tuple for Lambda, regardless of number of args
    if len(args) == 1:
        # For single argument, create a tuple with one element
        symbol_vars = (sympy.symbols(args[0]),)
    else:
        # For multiple arguments, ensure it's a tuple
        symbol_vars = tuple(sympy.symbols(args))

    parsed_expr = parseToSympy(self, ctx, stringExpression)
    lambda_func = sympy.Lambda(symbol_vars, parsed_expr)

    existingFunction = ctx["functions"].get(functionName)
    if isinstance(existingFunction, set) and bool(existingFunction) == False:
        return parsed_expr

    equationType = ctx["equationType"]
    if equationType == "NORMAL" or equationType == "NONE":
        if not existingFunction == None:
            if existingFunction == lambda_func:
                return parsed_expr
            else:
                ctx["functions"][functionName] = set()
                args_string = ", ".join(args)
                addSymbolError(
                    self,
                    ctx,
                    f"f({args_string})",
                    "Function assigned multiple times.",
                )

    if equationType == "NORMAL" or equationType == "NONE" or equationType == "FORCED":
        ctx["functions"][functionName] = lambda_func

    return parsed_expr


def solveFn(self, ctx, stringExpression):
    transformations = standard_transformations + (
        convert_equals_signs,
        convert_xor,
    )
    astTree = ast.parse(stringExpression)
    firstArgAst = getPath(astTree, "body[0].value.args[0]")
    secondArgAst = getPath(astTree, "body[0].value.args[1]")

    firstArg = sympy.parse_expr(
        ast.unparse(firstArgAst),
        local_dict={**sympy.__dict__, **ctx["internalVariables"], **ctx["symbols"]},
        transformations=transformations,
        evaluate=True,
    )

    secondArg = (
        sympy.parse_expr(
            ast.unparse(secondArgAst),
            local_dict={**sympy.__dict__},
            evaluate=True,
        )
        if secondArgAst
        else None
    )

    solveFor = []
    if isinstance(secondArgAst, ast.Name):
        temp = getPath(secondArgAst, "id")
        if temp and isinstance(temp, str):
            solveFor.append(temp)

    elif isinstance(secondArgAst, ast.Tuple):
        for element in secondArgAst.elts:
            if isinstance(element, ast.Name):
                temp = getPath(element, "id")
                if temp and isinstance(temp, str):
                    solveFor.append(temp)

    symbolsToSubstitute = {**ctx["internalVariables"], **ctx["symbols"]}
    for symbolString in solveFor:
        if symbolsToSubstitute.get(symbolString):
            symbolsToSubstitute.pop(symbolString)

    substitutedFirstArg = substitute(firstArg, symbolsToSubstitute, ctx["functions"])

    if secondArg:
        solveResult = sympy.solve(substitutedFirstArg, secondArg)
    else:
        solveResult = sympy.solve(substitutedFirstArg)
        return self.convertToLatex(solveResult, ctx["options"]["order"])

    finalResult = {}
    if isinstance(solveResult, list):
        if len(solveResult) == 1 and len(solveFor) == 1:
            finalResult[solveFor[0]] = solveResult[0]

        elif len(solveResult) >= 2 and len(solveFor) == 1:
            finalResult[solveFor[0]] = solveResult
        else:
            finalResult[solveFor[0]] = set()

    elif isinstance(solveResult, dict):
        for symbolString in solveFor:
            solution = solveResult[sympy.symbols(symbolString)]
            if solution:
                finalResult[symbolString] = solution

    finalStrings = []
    for key, value in finalResult.items():
        if not value and isinstance(value, set):
            finalStrings.append(key + " = " + r"\varnothing")
        else:
            result = storeSymbol(self, ctx, key, value, ctx["equationType"])

            if result:
                finalStrings.append(
                    key + " = " + self.convertToLatex(value, ctx["options"]["order"])
                )
            else:
                raise
                # finalStrings.append(key + " = " + r"\O")

    return r"\\&".join(finalStrings)


def parse_ast_value(ast_node):
    """Convert AST node to Python value"""
    if isinstance(ast_node, ast.Constant):
        return ast_node.value
    elif isinstance(ast_node, ast.Tuple):
        return tuple(parse_ast_value(elt) for elt in ast_node.elts)
    elif isinstance(ast_node, ast.List):
        return [parse_ast_value(elt) for elt in ast_node.elts]
    elif isinstance(ast_node, ast.Name):
        # Handle boolean values and None
        if ast_node.id == "True":
            return True
        elif ast_node.id == "False":
            return False
        elif ast_node.id == "None":
            return None
        else:
            return ast_node.id  # Return as string for unknown names
    elif isinstance(ast_node, ast.UnaryOp) and isinstance(ast_node.op, ast.USub):
        # Handle negative numbers
        operand = parse_ast_value(ast_node.operand)
        return -operand if isinstance(operand, (int, float)) else operand
    else:
        # For complex expressions, try to evaluate as SymPy expression
        try:
            expr_str = ast.unparse(ast_node)
            return sympy.parse_expr(expr_str, evaluate=True)
        except:
            return ast.unparse(ast_node)  # Fallback to string representation


def plotFn(self, ctx, stringExpression):
    """Handle plot() function calls"""
    try:
        import matplotlib

        matplotlib.use("Agg")  # Use non-interactive backend
        import matplotlib.pyplot as plt

        # Parse the plot expression using AST similar to solveFn
        astTree = ast.parse(stringExpression)

        # Get the arguments and keyword arguments from plot(expr, range, **kwargs)
        plotArgs = getPath(astTree, "body[0].value.args")
        plotKwargs = getPath(astTree, "body[0].value.keywords")

        if not plotArgs or len(plotArgs) < 2:
            return "Invalid plot syntax. Use: plot(expression, (variable, start, end))"

        # Parse the first argument (expression(s) to plot)
        firstArgAst = plotArgs[0]

        # Check if it's an array/list of expressions
        if isinstance(firstArgAst, ast.List):
            # Multiple expressions
            expressions = []
            for expr_ast in firstArgAst.elts:
                expr_str = ast.unparse(expr_ast)
                expr = parseToSympy(self, ctx, expr_str, alwaysEvaluate=True)
                # Substitute functions and symbols
                expr = substitute(expr, ctx["symbols"], ctx["functions"])
                expressions.append(expr)
            firstArg = expressions
        else:
            # Single expression (existing behavior)
            expr_str = ast.unparse(firstArgAst)
            firstArg = parseToSympy(self, ctx, expr_str, alwaysEvaluate=True)
            # Substitute functions and symbols
            firstArg = substitute(firstArg, ctx["symbols"], ctx["functions"])

        # Parse the second argument (range tuple)
        secondArgAst = plotArgs[1]
        if isinstance(secondArgAst, ast.Tuple) and len(secondArgAst.elts) == 3:
            # Extract (variable, start, end)
            var_ast = secondArgAst.elts[0]
            start_ast = secondArgAst.elts[1]
            end_ast = secondArgAst.elts[2]

            variable = sympy.parse_expr(ast.unparse(var_ast))
            start = sympy.parse_expr(ast.unparse(start_ast), evaluate=True)
            end = sympy.parse_expr(ast.unparse(end_ast), evaluate=True)

            # Parse all kwargs generically
            plot_kwargs = {}
            if plotKwargs:
                for kwarg in plotKwargs:
                    try:
                        plot_kwargs[kwarg.arg] = parse_ast_value(kwarg.value)
                    except Exception:
                        # Skip invalid kwargs rather than failing
                        pass

            # Configure theme before creating plot
            theme = ctx["options"].get("theme", "LIGHT")
            if theme == "DARK":
                plt.style.use("dark_background")
            else:
                # Reset to default light theme
                plt.style.use("default")

            # Create the plot using SymPy with all kwargs
            if isinstance(firstArg, list):
                # Multiple expressions: unpack the list as separate arguments
                plot_obj = sympy.plot(
                    *firstArg, (variable, start, end), show=False, **plot_kwargs
                )
            else:
                # Single expression
                plot_obj = sympy.plot(
                    firstArg, (variable, start, end), show=False, **plot_kwargs
                )

            # Process the plot to actually render it
            plot_obj._backend.process_series()

            # Capture the matplotlib figure
            # Different ways to access the figure depending on SymPy version
            try:
                fig = plot_obj._backend.fig
            except AttributeError:
                try:
                    fig = plot_obj._backend.figure
                except AttributeError:
                    # Try getting the current figure from matplotlib
                    fig = plt.gcf()

            # Convert to base64
            buffer = io.BytesIO()
            fig.savefig(buffer, format="png", bbox_inches="tight", dpi=100)
            buffer.seek(0)
            plot_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            buffer.close()

            # Close the figure to free memory
            plt.close(fig)

            # Add to plots array
            if isinstance(firstArg, list):
                title = f"Multi-line plot: {', '.join(str(expr) for expr in firstArg)}"
            else:
                title = f"Plot of {firstArg}"

            plot_info = {"type": "2d", "data": plot_base64, "title": title}
            ctx["plots"].append(plot_info)

            # Return None to not display any latex output
            return None

        else:
            return "Invalid plot range. Use: (variable, start, end)"

    except Exception as error:
        return f"Plot error: {str(error)}"


def getPath(coll, path, default=None):
    try:
        for k in path.replace("]", "").replace("[", ".").split("."):
            if not k:
                continue
            try:
                coll = coll[int(k)] if k.isdigit() else coll[k]
            except:
                coll = getattr(coll, k)
        return coll
    except:
        return default


class CustomLatexPrinter(LatexPrinter):
    def _print_Add(self, expr, order=None):
        terms = self._as_ordered_terms(expr, order=order)

        tex = ""
        for i, term in enumerate(terms):
            if i == 0:
                pass
            elif term.could_extract_minus_sign():
                tex += " - "
                term = -term
            else:
                tex += " + "

            term_tex = self._print(term)
            if i == 0 and len(terms) == 2 and term.is_Add:
                pass
            elif self._needs_add_brackets(term):
                term_tex = r"\left(%s\right)" % term_tex

            tex += term_tex

        return tex
`[0];
