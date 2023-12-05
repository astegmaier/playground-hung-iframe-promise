//////////////
// Solution //
//////////////

const originalPromise = window.Promise;
const promiseRejectFns = new Set(); // TODO: make sure we only store weak references

window.Promise = function (executor) {
  return new originalPromise((resolve, reject) => {
    promiseRejectFns.add(reject);
    executor(resolve, reject);
  });
};

window.addEventListener("unload", () => {
  console.log("iframe unload event fired!");
  for (const rejectFn of promiseRejectFns) {
    console.log("Interceptor rejecting promise!");
    rejectFn(new Error("Iframe closed"));
    console.log("Intercepted promise rejected");
  }
  promiseRejectFns.clear();
});

///////////////////
// Original Code //
///////////////////

window.wait = async (ms) => {
  console.log(
    `iframe wait() starting - it will complete in ${ms / 1000} seconds.`
  );
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.log(`iframe wait() finished after ${ms / 1000} seconds.`);
};
