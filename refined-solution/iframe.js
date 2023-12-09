window.wait = async (ms) => {
  console.log(
    `iframe wait() starting - it will complete in ${ms / 1000} seconds.`
  );
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.log(`iframe wait() finished after ${ms / 1000} seconds.`);
};

window.basicFetch = () => {
  const fetchPromise = fetch("https://dummyjson.com/products/1");
  console.log(`iframe fetch() called.`);
  return fetchPromise;
};

window.fetchWithChainedWait = () => {
  const fetchPromise = basicFetch();
  return fetchPromise.then((result) => {
    console.log("fetchPromise resolved. Starting iframe await of 3 seconds");
    return new Promise((resolve) =>
      setTimeout(() => {
        console.log("finished iframe await of 3 seconds");
        resolve(result);
      }, 3000)
    );
  });
};
