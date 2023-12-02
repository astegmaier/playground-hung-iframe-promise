# Hung Iframe Promise Playground</h1>

This project shows a memory leak that can occur if code on the main window awaits a promise from within the iframe before performing memory cleanup. If the iframe is removed before the iframe promise resolves, the awaiting function will halt execution and cleanup code will never run.

For more details [see it running live](https://astegmaier.github.io/playground-hung-iframe-promise/).

## Running Locally

1. Clone this repo by running `git clone https://github.com/astegmaier/playground-hung-iframe-promise.git`
2. Change into the directory by running `cd playground-hung-iframe-promise`
3. Ensure [nodejs](https://nodejs.org/en/) is installed.
4. Run `npx http-server` to start a local server. You can also install `http-server` globally by running `npm install -g http-server` and then running `http-server` directly.
5. Open `http://localhost:8080/` in your browser.
