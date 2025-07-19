import {
  renderWidget,
  usePlugin,
  useRunAsync,
  useTrackerPlugin,
  WidgetLocation,
} from '@remnote/plugin-sdk';
import { useEffect, useRef, useState } from 'react';
import '../App.css';
import { AutoResizeTextarea } from '../helpers/AutoResizeTextarea';
import { HELP_URL, MATH_SOLVER_POWERUP, PROPERTIY_CONFIG, SETTINGS_CONFIG } from '../constants';
import { loadPyodideInBackground } from '../helpers/loadPyodide';
import { computeMathSolver } from '../helpers/computeMathSolver';

export const MathSolverRemWidget = () => {
  const plugin = usePlugin();

  const [text, setText] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [plots, setPlots] = useState<any[]>([]);
  const [uiState, setUiState] = useState('CLOSED');

  const initalTextRef = useRef<string | undefined>();
  const uiStateRef = useRef<string>();
  uiStateRef.current = uiState;
  const computeSheduledRef = useRef<any>();
  const pyodideInstanceRef = useRef<any>();

  const widgetContext = useRunAsync(
    () => plugin.widget.getWidgetContext<WidgetLocation.UnderRemEditor>(),
    []
  );

  const remId = widgetContext?.remId;
  const rem = useRunAsync(async () => await plugin.rem.findOne(remId), [remId]);

  useEffect(() => {
    if (rem) {
      rem
        .getPowerupProperty(MATH_SOLVER_POWERUP, PROPERTIY_CONFIG.mathExpressionCode)
        .then((value) => {
          if (value) {
            initalTextRef.current = value.toString();
            setText(value.toString());
          }
        });
      rem
        .getPowerupProperty(MATH_SOLVER_POWERUP, PROPERTIY_CONFIG.mathWarningsCode)
        .then((value) => {
          if (value) {
            setWarnings(JSON.parse(value));
          }
        });
    }
  }, [rem]);

  const controlsOnHover = useTrackerPlugin(
    async (reactivePlugin: any) =>
      await reactivePlugin.settings.getSetting(SETTINGS_CONFIG.controlsOnHover),
    []
  );

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (uiStateRef.current === 'OPEN') {
        await computeAndStore(text, 'CLOSED');
        if (pyodideInstanceRef.current) {
          pyodideInstanceRef.current.terminate();
          pyodideInstanceRef.current = undefined;
        }
      }
    }
  };

  const openClicked = async (e: any) => {
    e.preventDefault();

    setUiState('OPEN');

    if (!pyodideInstanceRef.current) {
      let newInstance = await loadPyodideInBackground();
      if (newInstance) {
        if (uiStateRef.current === 'OPEN' || computeSheduledRef.current) {
          pyodideInstanceRef.current = newInstance;

          if (computeSheduledRef.current) {
            computeSheduledRef.current();
          }
        } else {
          newInstance.terminate();
        }
      } else {
        plugin.app.toast("Couldn't initalize Math Solver plugin.");
      }
    }
  };

  const closeClicked = (e: any) => {
    e.preventDefault();

    let continueClosing = true;
    if (text !== initalTextRef.current) {
      continueClosing = confirm('Unsaved changes. Close anyway?');
    }

    if (continueClosing) {
      setUiState('CLOSED');
      if (pyodideInstanceRef.current) {
        pyodideInstanceRef.current.terminate();
        pyodideInstanceRef.current = undefined;
      }
      if (initalTextRef.current) {
        setText(initalTextRef.current);
      }
    }
  };

  const acceptClicked = async (e: any) => {
    e.preventDefault();

    await computeAndStore(text);
  };

  const helpClicked = async (e: any) => {
    e.preventDefault();

    window.open(HELP_URL, '_blank');
  };

  const graphsClicked = async (e: any) => {
    e.preventDefault();

    await plugin.widget.openPopup('math_solver_graphs_widget', { plots });
  };

  const dispayWarnings = (e: any) => {
    e.preventDefault();

    alert(warnings.join('\n'));
  };

  const computeAndStore = async (mathExpression: string, finalUiState = 'OPEN') => {
    setUiState('LOADING');

    if (rem) {
      await rem.setPowerupProperty(
        MATH_SOLVER_POWERUP,
        PROPERTIY_CONFIG.mathExpressionCode,
        [mathExpression] // value (RichTextInterface)
      );

      initalTextRef.current = mathExpression;
    }

    if (!pyodideInstanceRef.current) {
      const executionStopper = new Promise((resolve) => {
        computeSheduledRef.current = resolve;
      });
      await executionStopper;
    }

    await new Promise((r) => setTimeout(r, 1));

    computeSheduledRef.current = undefined;

    await runMath(mathExpression);
    setUiState(finalUiState);
  };

  const runMath = async (mathExpression: string) => {
    if (pyodideInstanceRef.current) {
      let plotTheme: 'DARK' | 'LIGHT' | undefined = await plugin.storage.getLocal('plotTheme');
      if (!plotTheme) {
        // Detect browser dark mode
        const isDarkMode =
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        plotTheme = isDarkMode ? 'DARK' : 'LIGHT';
        await plugin.storage.setLocal('plotTheme', plotTheme);
      }
      const result = await computeMathSolver(mathExpression, pyodideInstanceRef.current, plotTheme);

      if (result) {
        if (rem) {
          let warnings: string[] = [];
          for (const [symbol, errorMsgArray] of Object.entries(result.symbolErrors)) {
            warnings.push(`Error with symbol "${symbol}": ${(errorMsgArray as any).join(', ')} \n`);
          }
          setWarnings(warnings);
          setPlots(result.plots || []);

          await rem.setPowerupProperty(
            MATH_SOLVER_POWERUP,
            PROPERTIY_CONFIG.mathWarningsCode,
            [JSON.stringify(warnings)] // value (RichTextInterface)
          );

          rem.setText([{ text: result.latex, i: 'x', block: false }]);
        }
      } else {
        plugin.app.toast('Math Solver internal error.');
      }
    }
  };

  // useEffect(() => {
  //   // FOR DEBUGGING
  //   (async () => {
  //     const temp: any = {};
  //     temp['accessToken'] = await plugin.storage.getSynced('accessToken');
  //     temp['shopSessionTimestamp'] = await plugin.storage.getLocal('shopSessionTimestamp');
  //     temp['trialPeriodStart'] = await plugin.storage.getSynced('trialPeriodStart');
  //     temp['gracePeriodStart'] = await plugin.storage.getSynced('gracePeriodStart');
  //     temp['purchaseLastValid'] = await plugin.storage.getSynced('purchaseLastValid');
  //     temp['shopSessionId'] = await plugin.storage.getLocal('shopSessionId');
  //     console.log(temp);
  //   })();
  // }, []);

  return (
    <div
      className={
        'mathsolver-plugin mathsolver-plugin--root' +
        (warnings.length === 0 && controlsOnHover ? ' mathsolver-plugin--hide' : '')
      }
    >
      <div className="mathsolver-plugin__controls-wrapper">
        {uiState === 'CLOSED' && (
          <div className="mathsolver-plugin__controls mathsolver-plugin__controls--closed">
            <a href="#" className="mathsolver-plugin__control" onClick={openClicked}>
              <img src={`${plugin.rootURL}mathsolver.png`} />
            </a>
            {warnings.length > 0 && (
              <a href="#" className="mathsolver-plugin__control" onClick={dispayWarnings}>
                <img src={`${plugin.rootURL}warning.png`} />
              </a>
            )}
          </div>
        )}
        {uiState === 'OPEN' && (
          <div className="mathsolver-plugin__controls mathsolver-plugin__controls--open">
            <a href="#" className="mathsolver-plugin__control" onClick={closeClicked}>
              <img src={`${plugin.rootURL}close.png`} />
            </a>
            <a href="#" className="mathsolver-plugin__control" onClick={acceptClicked}>
              <img src={`${plugin.rootURL}accept.png`} />
            </a>
            <a href="#" className="mathsolver-plugin__control" onClick={helpClicked}>
              <img src={`${plugin.rootURL}questionmark.png`} />
            </a>
            {plots.length > 0 && (
              <a href="#" className="mathsolver-plugin__control" onClick={graphsClicked}>
                <img src={`${plugin.rootURL}graph.png`} />
              </a>
            )}
            {warnings.length > 0 && (
              <a href="#" className="mathsolver-plugin__control" onClick={dispayWarnings}>
                <img src={`${plugin.rootURL}warning.png`} />
              </a>
            )}
          </div>
        )}
        {uiState === 'LOADING' && (
          <div className="mathsolver-plugin__controls mathsolver-plugin__controls--loading">
            <span>Calculating... (may take up to a minute)</span>
          </div>
        )}
      </div>
      <div className="mathsolver-plugin__input">
        {(uiState === 'OPEN' || uiState === 'LOADING') && (
          <AutoResizeTextarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>
    </div>
  );
};

renderWidget(MathSolverRemWidget);
