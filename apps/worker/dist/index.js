"use strict";
const worker = async () => {
    // Get command line arguments (skip first two as they are node path and script path)
    const args = process.argv.slice(2);
    console.log('Worker started');
    console.log('Arguments received:', args);
    console.log('Worker finished');
};
worker();
