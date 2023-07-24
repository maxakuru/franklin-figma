import './setup'; // must be first

export { default as Widget } from './Widget';

/**
 * to enable widgets, set to true and add these lines to manifest.json:
 * ```
 * "containsWidget": true,
 * "widgetApi": "1.0.0"
 * ```
 */

export const ENABLE_WIDGET = false;
