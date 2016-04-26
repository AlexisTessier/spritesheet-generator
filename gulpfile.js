'use strict';

var _ = require('lodash');

var task = require('@alexistessier/gulp-workflow-common-task');

task.babel('es6-for-node');

task.mustache('readme-for-node-package');

task.build();
task.watch();

task.default('build');