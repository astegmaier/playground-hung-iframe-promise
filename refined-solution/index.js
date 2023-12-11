//////////////////////
// Refined Solution //
//////////////////////

const iframePromiseRejectFns = new Set();

let promiseCounter = 0;

function patchIframePromises(windowContext) {
  const OriginalIframePromise = windowContext.Promise;
  let promiseRejectFns = new Set();
  class IFramePromise extends OriginalIframePromise {
    // Our intention with setting Symbol.species to the original Promise class is to ensure that the things
    // returned by the then()/catch()/finally() methods are pure Promises and _not_ IframePromises.
    // We don't want to track or dispose these derived promises on iframe removal, because that could cause legitimate logic to halt.
    // For example, a "then" handler after a "catch" block would never run if the "then" promise was disposed.
    // These handlers might even be registered in outside-of-iframe code, which would be especially bad.
    static get [Symbol.species]() {
      return OriginalIframePromise;
    }
    constructor(executor) {
      let promiseId = promiseCounter;
      console.log(`Creating IframePromise ${promiseId}`);
      promiseCounter += 1;
      super((resolve, reject) => {
        promiseRejectFns?.add(reject);
        executor(
          (value) => {
            promiseRejectFns?.delete(reject);
            resolve(value);
          },
          (reason) => {
            promiseRejectFns?.delete(reject);
            reject(reason);
          }
        );
      });
      this.promiseId = promiseId;
    }
  }
  windowContext.Promise = IFramePromise;
  windowContext.DEBUG_ORIGINAL_PROMISE = OriginalIframePromise;
  windowContext.DEBUG_SPIKED_PROMISE = IFramePromise;

  const rejectAllPromises = () => {
    console.log(`Rejecting ${promiseRejectFns?.size ?? 0} IframePromises.`);
    if (promiseRejectFns) {
      for (const rejectFn of promiseRejectFns) {
        rejectFn?.(new Error(`Promise rejected due to iframe disposal`));
      }
      promiseRejectFns.clear();
      // We don't want to leak promiseRejection functions in the case where we've already rejected them.
      // This can happen in cases where derived promises are created after the iframe has been disposed.
      promiseRejectFns = null;
      // By restoring the promise Prototype, we are being defensive to avoid the possibility that any late-created promises
      // register additional promiseRejectFns which might leak retainers if they are not cleared.
      windowContext.Promise = OriginalIframePromise;
    }
  };
  return rejectAllPromises;
}

////////////////////
// Test Scenarios //
////////////////////

document.getElementById("add-iframe-await-scenario").onclick = async () => {
  console.log("Starting scenario");
  leakedThings += 1;
  const iframe = await getPatchedIframe();
  try {
    await iframe.contentWindow.wait(3000);
  } catch (error) {
    // With the fix above, the iframe promise will reject if the iframe is removed before wait() completes, and we will catch here and continue to clean up the LeakyThing.
    console.log("Caught this error from iframe promise:", error.message);
  }
  leakedThings -= 1;
  console.log(`All promises resolved - we have leaked ${leakedThings} things.`);
};

document.getElementById("add-iframe-promise-chain-scenario").onclick =
  async () => {
    console.log("Starting scenario");
    leakedThings += 1;
    const iframe = await getPatchedIframe();

    await iframe.contentWindow
      .wait(3000)
      .then(() => {
        leakedThings -= 1;
        console.log("first then() block called - cleaning up leakedThings.");
      })
      .finally(() => {
        console.log("first finally() block called.");
      })
      .catch((error) => {
        leakedThings -= 1;
        console.log(
          "catch() block called - cleaning up leakedThings - caught this Error:",
          error.message
        );
      }) // Both of of these post-catch blocks should run, regardless of whether the iframe is removed ahead of time or not.
      .then(() => {
        console.log("Post-catch then() block called.");
      })
      .finally(() => {
        console.log("Post-catch finally() block called.");
      });

    console.log(
      `All promises resolved - we have leaked ${leakedThings} things.`
    );
  };

document.getElementById("add-iframe-fetch-scenario").onclick = async () => {
  console.log("Starting scenario");
  leakedThings += 1;
  const iframe = await getPatchedIframe();
  const iframeFetchPromise = iframe.contentWindow.basicFetch();
  // The promise returned by the fetch() call within the iframe is an instance of the original Promise class, not the overridden subclass.
  // However, in testing, this doesn't seem to be a problem because the fetch promise gets rejected when the iframe is removed.
  console.log(
    "iframeFetchPromise instanceof original iframe.contentWindow.Promise",
    iframeFetchPromise instanceof iframe.contentWindow.DEBUG_ORIGINAL_PROMISE,
    "iframeFetchPromise instanceof subclass IframePromise",
    iframeFetchPromise instanceof iframe.contentWindow.DEBUG_SPIKED_PROMISE
  );
  await iframeFetchPromise
    .then((res) => {
      console.log("first then() block called - generating json from response");
      return res.json();
    })
    .then((json) => {
      console.log("second then() block called - logging json:", json);
    })
    .catch((error) => {
      console.log("catch() block called - caught this Error:", error.message);
    })
    .finally(() => {
      console.log("Post-catch then() block called.");
    });
  console.log(`All promises resolved.`);
};

document.getElementById("add-iframe-fetch-chained-wait-scenario").onclick =
  async () => {
    console.log("Starting scenario");
    leakedThings += 1;
    const iframe = await getPatchedIframe();
    const iframeFetchPromise = iframe.contentWindow.fetchWithChainedWait();
    console.log(
      "iframeFetchPromise instanceof original iframe.contentWindow.Promise",
      iframeFetchPromise instanceof iframe.contentWindow.DEBUG_ORIGINAL_PROMISE,
      "iframeFetchPromise instanceof subclass IframePromise",
      iframeFetchPromise instanceof iframe.contentWindow.DEBUG_SPIKED_PROMISE
    );
    await iframeFetchPromise
      .then((res) => {
        console.log(
          "first then() block called - generating json from response"
        );
        return res.json();
      })
      .then((json) => {
        console.log("second then() block called - logging json:", json);
      })
      .catch((error) => {
        console.log("catch() block called - caught this Error:", error.message);
      })
      .finally(() => {
        console.log("Post-catch then() block called.");
      });
    console.log(`All promises resolved.`);
  };

document.getElementById("add-iframe-outside-inside-scenario").onclick =
  async () => {
    console.log("Starting scenario");
    leakedThings += 1;
    const iframe = await getPatchedIframe();
    const mainWindowWait = new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const result = await iframe.contentWindow.awaitMainWindowThenAwaitAgain(
        mainWindowWait
      );
      console.log(
        "finished awaiting awaitMainWindowThenAwaitAgain() - result:",
        result
      );
    } catch (e) {
      console.log("Main window caught this error", e);
    }
    console.log(`All promises resolved.`);
  };

//////////////////
// Test Helpers //
//////////////////

let leakedThings = 0;

async function getPatchedIframe() {
  const iframe = await getIframe();
  const rejectIframePromises = patchIframePromises(iframe.contentWindow);

  iframePromiseRejectFns.add(rejectIframePromises);
  iframe.contentWindow.addEventListener("unload", () => {
    console.log(`Iframe unload event fired. Rejecting promises.`);
    iframePromiseRejectFns.delete(rejectIframePromises);
    rejectIframePromises();
  });
  return iframe;
}

function getIframe() {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.onload = () => resolve(iframe);
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="text/javascript" src="./iframe.js"></script>
      </head>
      <body>
        <h1>Hi, I am an iframe.</h1>
      </body>
      </html>
    `;
    document.getElementById("iframe-container").appendChild(iframe);
  });
}

document.getElementById("remove-iframes").onclick = () => {
  document.getElementById("iframe-container").textContent = "";
  console.log(`Iframe removed.`);
};

document.getElementById("reject-all-promises").onclick = () => {
  console.log(`Manually rejecting iframe promises.`);
  for (const rejectFn of iframePromiseRejectFns) {
    rejectFn();
  }
  iframePromiseRejectFns.clear();
};
