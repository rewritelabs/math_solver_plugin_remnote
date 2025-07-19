import { renderWidget, usePlugin, useRunAsync } from '@remnote/plugin-sdk';
import { useState, useEffect } from 'react';

import '../App.css';

export const MathSolverGraphsWidget = () => {
  const plugin = usePlugin();
  const [plotTheme, setPlotTheme] = useState<string>('LIGHT');

  const widgetContext = useRunAsync(() => plugin.widget.getWidgetContext(), []);

  const plots = (widgetContext as any)?.contextData?.plots || [];

  useEffect(() => {
    const loadTheme = async () => {
      const theme: string | undefined = await plugin.storage.getLocal('plotTheme');
      if (theme) {
        setPlotTheme(theme);
      }
    };
    loadTheme();
  }, []);

  const downloadImage = (plot: any, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${plot.data}`;
    link.download = `math-plot-${index + 1}.png`;
    link.click();
  };

  const switchTheme = async () => {
    const newTheme = plotTheme === 'LIGHT' ? 'DARK' : 'LIGHT';
    await plugin.storage.setLocal('plotTheme', newTheme);
    setPlotTheme(newTheme);
    await plugin.app.toast('Please recalculate the math to see graphs in the new theme');
    await plugin.widget.closePopup();
  };

  const closePopup = async (e: any) => {
    e.preventDefault();
    await plugin.widget.closePopup();
  };

  return (
    <div className="mathsolver-plugin__graphs">
      <div style={{ padding: '20px', width: '100%' }}>
        <h2>Math Solver Graphs ({plots.length})</h2>
        <div style={{ marginBottom: '20px' }}>
          <button onClick={closePopup} style={{ marginRight: '10px', padding: '10px 20px' }}>
            Close
          </button>
          <button onClick={switchTheme} style={{ padding: '10px 20px' }}>
            Switch to {plotTheme === 'LIGHT' ? 'dark' : 'light'} mode
          </button>
        </div>
        {plots.length === 0 ? (
          <p>No graphs available</p>
        ) : (
          <div>
            {plots.map((plot: any, index: number) => (
              <div key={index} style={{ marginBottom: '30px' }}>
                <h4>{plot.title}</h4>
                <img
                  src={`data:image/png;base64,${plot.data}`}
                  alt={plot.title}
                  style={{ width: '100%', height: 'auto' }}
                />
                <button
                  onClick={() => downloadImage(plot, index)}
                  style={{ marginTop: '10px', padding: '8px 16px' }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

renderWidget(MathSolverGraphsWidget);
