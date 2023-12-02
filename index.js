document.getElementById("add-iframe-then-remove").onclick = async () => {
  const iframe = document.createElement("iframe");
  iframe.id = "iframe";
  iframe.style.height = "400px";
  iframe.style.backgroundColor = "lightgrey";
  iframe.srcdoc = `
          <!DOCTYPE html>
          <html>
          <body>
            <h1>Hi, I am the iframe.</h1>
          </body>
          </html>
        `;
  document.getElementById("main").appendChild(iframe);
  console.log("iframe added");

  await wait(100);

  document.getElementById("main").textContent = "";
  console.log("iframe removed");
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
