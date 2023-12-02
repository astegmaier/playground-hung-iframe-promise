# Hung Iframe Promise Playground</h1>

This project tests the behavior of promises that execute within an iframe that are awaited from outside the iframe. Do they hang?

For more details [see it running live](https://astegmaier.github.io/playground-hung-iframe-promise/).

## Running Locally

1. Clone this repo by running `git clone https://github.com/astegmaier/playground-hung-iframe-promise.git`
2. Change into the directory by running `cd playground-hung-iframe-promise`
3. Ensure [nodejs](https://nodejs.org/en/) is installed.
4. Run `npx http-server` to start a local server. You can also install `http-server` globally by running `npm install -g http-server` and then running `http-server` directly.
5. Open `http://localhost:8080/` in your browser.
