window.wait = async (ms) => {
  console.log(
    `iframe wait() starting - it will complete in ${ms / 1000} seconds.`
  );
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.log(`iframe wait() finished after ${ms / 1000} seconds.`);
};

window.makeFetchCallFromIframe = () => {
  const fetchPromise = fetch("https://dummyjson.com/products/1");
  console.log(`iframe fetch() called.`);
  return fetchPromise;
};
