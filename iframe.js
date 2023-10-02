// Extract css path from query string
const cssPath = /^\?css=(.*)$/.exec(window.location.search)?.[1];

if (cssPath == null) {
  throw new Error("No css path provided");
}

const linkEl = document.createElement("link");
linkEl.rel = "stylesheet";
linkEl.href = cssPath;

const linkLoaded = new Promise((resolve) => {
  linkEl.addEventListener("load", resolve);
});

document.head.appendChild(linkEl);

await linkLoaded;

let styleSheet = null;
for (const sheet of document.styleSheets) {
  if (sheet.href?.endsWith(`/${cssPath}`)) {
    styleSheet = sheet;
    break;
  }
}

if (styleSheet == null) {
  throw new Error("No style sheet found");
}

const cssProperties = Object.values(styleSheet.cssRules[0].style).filter(
  (property) => property.startsWith("--")
);

const containerEl = document.getElementById("container");

const h1El = document.createElement("h1");
h1El.innerText = cssPath.slice(cssPath.lastIndexOf("/") + 1);
containerEl.appendChild(h1El);

let prevProperty = null;

cssProperties.forEach((property, i) => {
  const div = document.createElement("div");
  div.className = "swatch";
  containerEl.appendChild(div);

  const computedStyle = window.getComputedStyle(div);
  div.innerText = `${property}: ${computedStyle.getPropertyValue(property)}`;

  if (
    i > 0 &&
    getPrefix(property) !== getPrefix(prevProperty) &&
    !/-hue$/.test(prevProperty)
  ) {
    div.style.marginTop = "40px";
  }

  if (/-hue$/.test(property)) {
  } else {
    div.style.setProperty("background-color", `var(${property})`);
    const colorWeight = /-(\d+)$/.exec(property)?.[1];
    div.style.setProperty(
      "color",
      colorWeight == null || colorWeight >= 700
        ? "var(--dh-color-gray-75)"
        : "var(--dh-color-gray-800)"
    );
    // div.innerText = `${property}: ${computedStyle.backgroundColor}`;
  }

  prevProperty = property;
});

function getPrefix(property) {
  return /^--dh-color-(.*?)-/.exec(property)?.[1];
}
