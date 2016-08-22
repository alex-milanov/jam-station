'use strict';

const path = require('path');

const paths = [].concat(
	require('bourbon').includePaths,
	require('bourbon-neat').includePaths,
	path.resolve(__dirname, '..', 'node_modules/font-awesome/scss')
);

process.stdout.write(paths.join(':'));
