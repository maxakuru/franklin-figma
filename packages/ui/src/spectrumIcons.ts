import type { AnyOk } from './types';

import _Edit from '@spectrum-icons/workflow/Edit';

/**
 * Workaround for janky default exports between cjs/esm
 */

export const Edit = ((_Edit as AnyOk).default) as typeof _Edit;