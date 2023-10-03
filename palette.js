import {
  buildSwatches,
  getCssPath,
  loadCssProperties,
  setHeading,
} from "./util.js";

const cssPath = getCssPath();

const cssPropertyNames = await loadCssProperties(cssPath);

const containerEl = document.getElementById("container");

setHeading(containerEl, cssPath);

buildSwatches(containerEl, cssPropertyNames);
