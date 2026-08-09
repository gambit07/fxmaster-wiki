export const modulePackagePages = Object.freeze({
  core: 'https://foundryvtt.com/packages/fxmaster/',
  plus: 'https://foundryvtt.com/packages/fxmaster-plus',
});

export const modulePackageNames = Object.freeze({
  core: "Gambit's FXMaster",
  plus: "Gambit's FXMaster+",
});

export function modulePackagePage(packageName) {
  return modulePackagePages[packageName] ?? modulePackagePages.core;
}

export function modulePackageName(packageName) {
  return modulePackageNames[packageName] ?? modulePackageNames.core;
}
