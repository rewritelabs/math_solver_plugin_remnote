import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import {
  MATH_SOLVER_POWERUP,
  MATH_SOLVER_POWERUP_NAME,
  PROPERTIY_CONFIG,
  SETTINGS_CONFIG,
} from '../constants';

async function onActivate(plugin: ReactRNPlugin) {
  // Register settings
  await plugin.settings.registerBooleanSetting({
    id: SETTINGS_CONFIG.controlsOnHover,
    title: 'Show controls on hover only',
    description: 'Hide the calculator button and other controls until you hover over the widget',
    defaultValue: false,
  });

  // Register commands
  await plugin.app.registerCommand({
    id: 'math-solver-add',
    name: 'Add Math Solver',
    action: async () => {
      const rem = await plugin.focus.getFocusedRem();
      const powerup = await plugin.powerup.getPowerupByCode(MATH_SOLVER_POWERUP);
      await rem?.addTag(powerup!._id);
    },
  });

  // await plugin.app.registerCommand({
  //   id: 'math-solver-calculate',
  //   name: 'Calculate Math Solver',
  //   keyboardShortcut: 'opt+shift+m',
  //   action: async () => {
  //     const rem = await plugin.focus.getFocusedRem();
  //     await plugin.app.toast('Calc' + rem?._id);
  //   },
  // });

  await plugin.app.registerPowerup({
    name: MATH_SOLVER_POWERUP_NAME,
    code: MATH_SOLVER_POWERUP,
    description: 'Show the Math Solver Editor',
    options: {
      properties: [
        {
          code: PROPERTIY_CONFIG.mathExpressionCode,
          name: PROPERTIY_CONFIG.mathExpressionName,
          hidden: true,
          onlyProgrammaticModifying: true,
        },
        {
          code: PROPERTIY_CONFIG.mathWarningsCode,
          name: PROPERTIY_CONFIG.mathWarningsName,
          hidden: true,
          onlyProgrammaticModifying: true,
        },
      ],
    },
  });

  // Register widgets.
  await plugin.app.registerWidget('math_solver_rem_widget', WidgetLocation.UnderRemEditor, {
    dimensions: { height: 'auto', width: '100%' },
    powerupFilter: MATH_SOLVER_POWERUP,
  });

  await plugin.app.registerWidget('math_solver_upgrade_widget', WidgetLocation.Popup, {
    dimensions: { height: 540, width: 360 },
  });

  await plugin.app.registerWidget('math_solver_graphs_widget', WidgetLocation.Popup, {
    dimensions: { height: 540, width: 360 },
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
