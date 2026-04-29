import * as migration_20260412_115552 from './20260412_115552';
import * as migration_20260415_133531 from './20260415_133531';
import * as migration_20260416_remove_points_add_prerequisites from './20260416_remove_points_add_prerequisites';
import * as migration_20260428_185211 from './20260428_185211';
import * as migration_20260429_203502_question_richtext from './20260429_203502_question_richtext';

export const migrations = [
  {
    up: migration_20260412_115552.up,
    down: migration_20260412_115552.down,
    name: '20260412_115552',
  },
  {
    up: migration_20260415_133531.up,
    down: migration_20260415_133531.down,
    name: '20260415_133531',
  },
  {
    up: migration_20260416_remove_points_add_prerequisites.up,
    down: migration_20260416_remove_points_add_prerequisites.down,
    name: '20260416_remove_points_add_prerequisites',
  },
  {
    up: migration_20260428_185211.up,
    down: migration_20260428_185211.down,
    name: '20260428_185211',
  },
  {
    up: migration_20260429_203502_question_richtext.up,
    down: migration_20260429_203502_question_richtext.down,
    name: '20260429_203502_question_richtext'
  },
];
