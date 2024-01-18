const scope = process.env.BUILD_SCOPE;

const shieldHomeEntries = [
  {
    isReplaceMain: true,
    entry: 'src/components/shield-option-home/entry/entry.tsx',
    template: 'public/shield/option.html',
    outPath: '/index.html',
  },
];
const shieldAppEntries = [
  {
    isReplaceMain: true,
    entry: 'src/components/shield-option-trade/entry/entry.tsx',
    template: 'public/shield/option-app.html',
    outPath: '/index.html',
  },
];
const shieldV2AppEntries = [
  {
    isReplaceMain: true,
    entry: 'src/components/shield-option-trade-v2/entry/entry.tsx',
    template: 'public/option-app.html',
    outPath: '/index.html',
  },
];
const openSpaceEntries = [
  {
    isReplaceMain: true,
    entry: 'src/components/shield-option-trade/entry/entry.tsx',
    template: 'public/openspace/option-app.html',
    outPath: '/index.html',
  },
];
const doptionEntries = [
  {
    isReplaceMain: true,
    entry: 'src/components/shield-option-trade/entry/entry.tsx',
    template: 'public/doption/option-app.html',
    outPath: '/index.html',
  },
];
const fufutureEntries = [
  {
    isReplaceMain: true,
    entry: 'src/components/shield-option-trade/entry/entry.tsx',
    template: 'public/fufuture/option-app.html',
    outPath: '/index.html',
  },
];
const stoneEntries = [
  {
    isReplaceMain: true,
    entry: 'src/components/shield-stone/entry/entry.tsx',
    template: 'public/stone/stone.html',
    outPath: '/index.html',
  },
];

let entries;
switch (scope) {
  case 'home': {
    entries = shieldHomeEntries;
    break;
  }
  case 'shield': {
    entries = shieldAppEntries;
    break;
  }
  case 'shieldv2': {
    entries = shieldV2AppEntries;
    break;
  }
  case 'stone': {
    entries = stoneEntries;
    break;
  }
  case 'openspace': {
    entries = openSpaceEntries;
    break;
  }
  case 'doption': {
    entries = doptionEntries;
    break;
  }
  case 'fufuture': {
    entries = fufutureEntries;
    break;
  }
  default: {
    entries = shieldAppEntries;
  }
}

module.exports = { entries };
