const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '../../packages/shared');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch shared package only — do not resolve Metro from repo root (Next.js hoists incompatible versions).
config.watchFolders = [sharedRoot];

module.exports = config;
