console.log("hello from iframe");

window.longAwaitFunction = async () => {
  await wait(5000);
  await wait(5000);
  return "longAwaitFunctionResult";
};

let iteration = 0;

async function wait(ms) {
  console.log(
    `${iteration} - logAwaitFunction starting to waiting ${ms / 1000} seconds.`
  );
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.log(
    `${iteration} - logAwaitFunction finished to waiting ${ms / 1000} seconds.`
  );
  iteration++;
}
