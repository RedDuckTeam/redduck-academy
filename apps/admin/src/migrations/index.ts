import * as migration_20260412_115552 from './20260412_115552';
import * as migration_20260415_133531 from './20260415_133531';

export const migrations = [
  {
    up: migration_20260412_115552.up,
    down: migration_20260412_115552.down,
    name: '20260412_115552',
  },
  {
    up: migration_20260415_133531.up,
    down: migration_20260415_133531.down,
    name: '20260415_133531'
  },
];
