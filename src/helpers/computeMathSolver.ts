import { extractOptions } from './others';
import mathSolverString from '../mathSolver.py';

export const computeMathSolver = async (mathExpression: string, pyodideInstance: any, plotTheme?: string) => {
  const [mathExpressionToCompute, mathOptions] = extractOptions(mathExpression);

  let computeFunctionArgs = '';
  if (mathOptions?.size === 'LARGE') {
    computeFunctionArgs += ', size="LARGE"';
  }
  if (mathOptions?.order === 'LEX') {
    computeFunctionArgs += ', order="LEX"';
  }
  if (plotTheme) {
    computeFunctionArgs += `, theme="${plotTheme}"`;
  }

  const fullPython =
    `import json
` +
    mathSolverString +
    `
mathSolver = MathSolver()
result = mathSolver.compute(r"""
${mathExpressionToCompute}
"""${computeFunctionArgs})
json.dumps(result, default=list)`;

  try {
    // Check if any line starts with plot(
    const hasPlot = mathExpressionToCompute
      .split('\n')
      .some((line) => line.trim().startsWith('plot('));

    let resultJSON;
    if (hasPlot) {
      resultJSON = await pyodideInstance.runPythonWithMatplotlib(fullPython);
    } else {
      resultJSON = await pyodideInstance.runPython(fullPython);
    }

    const result = JSON.parse(resultJSON);
    return result;
  } catch (e) {
    console.error(e);
    return null;
  }
};
