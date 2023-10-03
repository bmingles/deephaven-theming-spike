/**
 * Load stylesheet with css properties.
 * @param {string} cssPath
 * @returns List of css property names
 */
export async function loadCssProperties(cssPath) {
  const linkEl = document.createElement("link");
  linkEl.rel = "stylesheet";
  linkEl.href = cssPath;

  const linkLoaded = new Promise((resolve) => {
    linkEl.addEventListener("load", resolve);
  });

  document.head.appendChild(linkEl);

  await linkLoaded;

  return getCssPropertyNames(cssPath);
}

/**
 * Extract css path from query string
 */
export function getCssPath() {
  const cssPath =
    /^\?css=(.*)$/.exec(window.location.search)?.[1] ?? "themes/hex.css";

  // if (cssPath == null) {
  //   throw new Error("No css path provided");
  // }

  return cssPath;
}

/**
 * Extract color name from `--dh-color-` prefixed css property name
 * @param {string} property
 * @returns Color name or undefined
 */
function extractColorName(property) {
  return /^--dh-color-(.*?)-/.exec(property)?.[1];
}

/**
 * Get css property names from stylesheet with given path.
 * @param {*} cssPath
 * @returns
 */
function getCssPropertyNames(cssPath) {
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

  return Object.values(styleSheet.cssRules[0].style).filter((property) =>
    property.startsWith("--")
  );
}

function hexToRgb(hex) {
  if (!hex.startsWith("#")) {
    return hex;
  }

  // Expand 3 digit hex to 6 digit
  if (hex.length === 4) {
    hex = hex.replace(/[a-z0-9]/gi, "$&$&");
  }

  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return `rgb(${r} ${g} ${b})`;
}

function rgbToHsl(rgb) {
  const match = /^rgb\((\d{1,3}) (\d{1,3}) (\d{1,3})\)$/.exec(rgb);

  if (match == null) {
    return rgb;
  }

  let [, r, g, b] = match;

  r /= 255;
  g /= 255;
  b /= 255;

  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);

  const l = (min + max) / 2;

  const s =
    l <= 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);

  let h;
  if (max === min) {
    h = 0;
  } else if (max === r) {
    h = 60 * ((g - b) / (max - min));
  } else if (max === g) {
    h = 60 * ((b - r) / (max - min)) + 120;
  } else if (max === b) {
    h = 60 * ((r - g) / (max - min)) + 240;
  }
  if (h < 0) {
    h += 360;
  }

  const hsl = {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };

  return `hsl(${hsl.h}deg ${hsl.s}% ${hsl.l}%)`;
}

/** Set page heading */
export function setHeading(containerEl, cssPath) {
  const h1El = document.createElement("h1");
  h1El.innerText = cssPath.slice(cssPath.lastIndexOf("/") + 1);
  containerEl.appendChild(h1El);
}

/** Build color swatches from css properties */
export function buildSwatches(containerEl, cssPropertyNames) {
  let prevProperty = null;

  cssPropertyNames.forEach((property, i) => {
    const div = document.createElement("div");
    div.className = "swatch";
    containerEl.appendChild(div);

    const computedStyle = window.getComputedStyle(div);
    const colorValue = computedStyle.getPropertyValue(property);
    const hslColorValue = rgbToHsl(
      hexToRgb(computedStyle.getPropertyValue(property))
    );
    div.innerHTML = `${property}: ${
      colorValue === hslColorValue && !/-label$/.test(property)
        ? colorValue
        : `${colorValue} <span title="HSL based on original HEX color">${
            /-label$/.test(property) ? "HSL derived from hex" : hslColorValue
          }</span>`
    }`;

    if (
      i > 0 &&
      extractColorName(property) !== extractColorName(prevProperty) &&
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
}
