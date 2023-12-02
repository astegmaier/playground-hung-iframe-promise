window.leakyThingRetainerSet = new Set();

class LeakyThing {}

document.getElementById("add-iframe").onclick = async () => {
  const iframe = await addIframe();
  console.log("Adding a LeakyThing to leakyThingRetainerArray.");
  const leakyThing = new LeakyThing();
  leakyThingRetainerSet.add(leakyThing);

  try {
    const result = await iframe.contentWindow.longAwaitFunction();
    console.log(
      "Got this result from iframe.contentWindow.longAwaitFunction",
      result
    );
  } catch (e) {
    console.log(
      "Got this error from iframe.contentWindow.longAwaitFunction",
      e
    );
  }

  leakyThingRetainerSet.delete(leakyThing);
  console.log("Cleaned up the LeakyThing");
};

function addIframe() {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.height = "400px";
    iframe.style.backgroundColor = "lightgrey";
    iframe.onload = () => resolve(iframe);
    iframe.srcdoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <script type="text/javascript" src="./iframe.js"></script>
    </head>
    <body>
      <h1>Hi, I am the iframe.</h1>
    </body>
    </html>
  `;
    document.getElementById("iframe-container").appendChild(iframe);
  });
}

document.getElementById("remove-iframe").onclick = () => {
  document.getElementById("iframe-container").textContent = "";
  console.log("iframe removed");
};

// function wait(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }
