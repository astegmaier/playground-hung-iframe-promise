//////////////////////
// Refined Solution //
//////////////////////

const iframePromiseRejectFns = new Set();

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
    }
  }
  windowContext.Promise = IFramePromise;
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
