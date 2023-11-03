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

  const cssPropertyNames = getCssPropertyNames(cssPath);

  if (cssPath.endsWith("hex.css")) {
    generateHSLRanges(cssPropertyNames);
  }

  return cssPropertyNames;
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

function parseRgba(rgbOrRgbaString) {
  const [, name, args] = /^(rgba?)\((.*?)\)$/.exec(rgbOrRgbaString) ?? [];
  if (name == null) {
    return null;
  }

  // Split on spaces, commas, and slashes. Note that this more permissive than
  // the CSS spec in that slashes should only be used to delimit the alpha value
  // (e.g. r g b / a), but this would match r/g/b/a. It also would match a mixed
  // delimiter case (e.g. r,g b,a). This seems like a reasonable tradeoff for the
  // complexity that would be added to enforce the full spec.
  const tokens = args.split(/[ ,/]/).filter(Boolean);

  if (tokens.length < 3) {
    return null;
  }

  const [r, g, b, a = 1] = tokens.map(Number);

  return { r, g, b, a };
}

function rgbaToHex8({ r, g, b, a = 1 }) {
  // eslint-disable-next-line no-param-reassign
  a = Math.round(a * 255);

  const [rh, gh, bh, ah] = [r, g, b, a].map((v) =>
    v.toString(16).padStart(2, "0")
  );

  return `#${rh}${gh}${bh}${ah}`;
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
    s: Math.round(s * 1000) / 10,
    l: Math.round(l * 1000) / 10,
  };

  if (Math.round(h) === 285) {
    console.log("[hsl]", r, g, b, hsl, h, s * 100, l * 100);
  }

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
    if (property.endsWith("-hsl")) {
      return;
    }

    const div = document.createElement("div");
    div.className = "swatch";
    containerEl.appendChild(div);

    const computedStyle = window.getComputedStyle(div);
    const colorValue = computedStyle.getPropertyValue(property);
    const hslColorValue = rgbToHsl(
      hexToRgb(computedStyle.getPropertyValue(property))
    );

    const isHex = colorValue !== hslColorValue;
    const isLabel = /-label$/.test(property);

    div.innerHTML = `${property}: ${
      !isHex && !isLabel
        ? colorValue
        : `${colorValue} <span title="HSL based on original HEX color">${
            isLabel ? "HSL derived from hex" : hslColorValue
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
      console.log("[prop]", property);
      const bgColor = `var(${property.replace(/-hsl$/, "")})`; // isHex ? colorValue : `var(${property})`;
      div.style.setProperty("background-color", bgColor);
      const colorWeight = /-(\d+)$/.exec(property)?.[1];

      div.style.setProperty(
        "color",
        colorWeight == null || colorWeight < 700
          ? "var(--dh-color-gray-800)"
          : "var(--dh-color-gray-75)"
      );

      const hex8 = rgbaToHex8(
        parseRgba(computedStyle.getPropertyValue("background-color"))
      );
      div.title = hex8.substring(0, 7);
      // div.innerText = `${property}: ${computedStyle.backgroundColor}`;
    }

    prevProperty = property;
  });
}

export function generateHSLRanges(cssPropertyNames) {
  const computedStyle = window.getComputedStyle(document.body);
  const colorPropRegex = /^--dh-color-(.*?)-\d/;
  const extractHsl = /^hsl\((\d+)deg (\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%\)$/;

  const baseHues = {};
  const colorGroups = {};
  const hslColorGroups = {};

  // Initialize colorGroups with hex colors
  cssPropertyNames.forEach((property) => {
    const colorName = colorPropRegex.exec(property)?.[1];
    if (colorName == null) {
      return;
    }

    if (colorGroups[colorName] == null) {
      colorGroups[colorName] = {};
    }

    // Hex color (this will get replaced below)
    colorGroups[colorName][property] = computedStyle.getPropertyValue(property);
  });

  // HSL colors
  for (const colorName in colorGroups) {
    const colorPropNames = Object.keys(colorGroups[colorName]);
    const hslColors = Object.values(colorGroups[colorName]).map((hex) =>
      rgbToHsl(hexToRgb(hex))
    );

    const hueAvg =
      colorName === "grayx"
        ? 0
        : Math.round(
            hslColors.reduce(
              (total, hsl) => total + Number(extractHsl.exec(hsl)?.[1]),
              0
            ) / hslColors.length
          );

    baseHues[colorName] = {
      [`--dh-color-${colorName}-hue`]: `${hueAvg}deg`,
    };
    hslColorGroups[colorName] = {};
    colorGroups[colorName] = {};

    hslColors.forEach((hsl, i) => {
      const [, h, s, l] = extractHsl.exec(hsl) ?? [];
      const offset = colorName === "grayx" ? 0 : Number(h) - hueAvg;
      const sign = offset >= 0 ? "+" : "-";

      // Hsl value arrays e.g. --dh-color-blue-100-hsl: var(--dh-color-blue-hue), 65%, 19%;
      hslColorGroups[colorName][`${colorPropNames[i]}-hsl`] =
        offset === 0
          ? `var(--dh-color-${colorName}-hue), ${s}%, ${l}%`
          : `calc(var(--dh-color-${colorName}-hue) ${sign} ${Math.abs(
              offset
            )}deg), ${s}%, ${l}%`;

      // Color variable based on hsl array e.g. --dh-color-blue-100: hsl(var(--dh-color-blue-100-hsl));
      colorGroups[colorName][
        colorPropNames[i]
      ] = `hsl(var(${colorPropNames[i]}-hsl))`;
    });
  }

  console.log("[Group]: baseHues", baseHues);
  console.log("[Group]: hslColorGroups", hslColorGroups);
  console.log("[Group]: colorGroups", colorGroups);

  const content = Object.entries(colorGroups)
    .map(([colorName, group]) => {
      const lines = [
        `/* ${colorName.replace(/^([a-z])/, (a) => a.toUpperCase())} */`,
        ...Object.entries(baseHues[colorName]).map(
          ([prop, value]) => `${prop}: ${value};`
        ),
        "",
        ...Object.entries(hslColorGroups[colorName]).map(
          ([prop, value]) => `${prop}: ${value};`
        ),
        "",
        ...Object.entries(group).map(([prop, value]) => `${prop}: ${value};`),
      ];

      return lines.join("\n");
    })
    .join("\n\n");

  console.log("[Content]:", content);

  // const hslColors = hexColors.map((hex) => rgbToHsl(hexToRgb(hex)));

  // console.log(hslColors);
}
