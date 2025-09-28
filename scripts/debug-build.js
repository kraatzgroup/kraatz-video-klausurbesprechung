#!/usr/bin/env node

/**
 * Debug Build Script
 * 
 * This script helps debug build issues by checking:
 * - Node.js version
 * - npm version
 * - Environment variables
 * - Dependencies
 * - Build process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Build Debug Information\n');

// Check Node.js version
console.log('📦 Environment:');
console.log(`Node.js: ${process.version}`);
console.log(`npm: ${execSync('npm --version', { encoding: 'utf8' }).trim()}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}\n`);

// Check environment variables
console.log('🌍 Environment Variables:');
const envVars = [
  'NODE_ENV',
  'CI',
  'GENERATE_SOURCEMAP',
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'REACT_APP_STRIPE_PUBLISHABLE_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    if (varName.includes('KEY') || varName.includes('SECRET')) {
      console.log(`${varName}: ${value.substring(0, 10)}...${value.substring(value.length - 4)}`);
    } else {
      console.log(`${varName}: ${value}`);
    }
  } else {
    console.log(`${varName}: (not set)`);
  }
});

console.log('\n📋 Package Information:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`Name: ${packageJson.name}`);
  console.log(`Version: ${packageJson.version}`);
  console.log(`React Scripts: ${packageJson.dependencies['react-scripts']}`);
  console.log(`TypeScript: ${packageJson.dependencies['typescript']}`);
  console.log(`Stripe React: ${packageJson.dependencies['@stripe/react-stripe-js']}`);
  console.log(`Stripe JS: ${packageJson.dependencies['@stripe/stripe-js']}`);
} catch (error) {
  console.log('❌ Could not read package.json');
}

console.log('\n🔧 Build Test:');
try {
  console.log('Running npm run build...');
  const buildOutput = execSync('npm run build', { 
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: 'false',
      GENERATE_SOURCEMAP: 'false'
    }
  });
  
  console.log('✅ Build successful!');
  
  // Check if build directory exists
  if (fs.existsSync('build')) {
    const buildFiles = fs.readdirSync('build');
    console.log(`📁 Build directory contains ${buildFiles.length} items`);
    
    // Check for main files
    const staticDir = path.join('build', 'static');
    if (fs.existsSync(staticDir)) {
      const jsDir = path.join(staticDir, 'js');
      const cssDir = path.join(staticDir, 'css');
      
      if (fs.existsSync(jsDir)) {
        const jsFiles = fs.readdirSync(jsDir);
        console.log(`📄 JavaScript files: ${jsFiles.length}`);
      }
      
      if (fs.existsSync(cssDir)) {
        const cssFiles = fs.readdirSync(cssDir);
        console.log(`🎨 CSS files: ${cssFiles.length}`);
      }
    }
  }
  
} catch (error) {
  console.log('❌ Build failed:');
  console.log(error.message);
  process.exit(1);
}

console.log('\n🎉 All checks passed! Build should work on Netlify.');
