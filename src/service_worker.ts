import { getRoutesFromConfig, convertRoutesToText, sortRoutes } from './utils.js';

const BASE_URL = 'http://192.168.1.1';
const TAB_URL = `${BASE_URL}/`;
const LOGIN_URL = `${BASE_URL}/login`;
const CONFIG_URL = `${BASE_URL}/ci/startup-config.txt`;

chrome.runtime.onInstalled.addListener(async () => {
  const tab = await getActiveTab();
  updateIcon(tab?.url);
});

chrome.webNavigation.onCompleted.addListener(
  ({ url }) => {
    updateIcon(url);
  },
  { url: [{ urlPrefix: TAB_URL }] },
);

chrome.webNavigation.onHistoryStateUpdated.addListener(
  ({ url }) => {
    updateIcon(url);
  },
  { url: [{ urlPrefix: TAB_URL }] },
);

// Activate tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateIcon(tab.url);
  });
});

// Clicked by icon
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && userHasAuthorization(tab.url)) {
    try {
      const configText = await getConfigText();
      const routes = getRoutesFromConfig(configText);
      const orderedRoutes = sortRoutes(routes);
      const routesText = convertRoutesToText(orderedRoutes);
      const filename = makeRoutesFilename();
      await downloadFile(routesText, filename);
    } catch (error) {
      console.error(error);
      alert('Ошибка при выгрузке файла с маршрутами');
    }
  }
});

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] ?? null);
    });
  });
}

function userHasAuthorization(url: string) {
  return url.startsWith(TAB_URL) && !url.startsWith(LOGIN_URL);
}

function updateIcon(url?: string) {
  const isEnabled = userHasAuthorization(url ?? '');

  chrome.action.setIcon({
    path: {
      '16': isEnabled ? 'icon_16.png' : 'icon_16_gray.png',
      '48': isEnabled ? 'icon_48.png' : 'icon_48_gray.png',
      '128': isEnabled ? 'icon_128.png' : 'icon_128_gray.png',
    },
  });

  if (isEnabled) {
    chrome.action.enable();
  } else {
    chrome.action.disable(); // Disabled only clickable
  }
}

function makeRoutesFilename(): string {
  const date = new Date();
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = `${date.getFullYear()}`;
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const dateStr = `${day}_${month}_${year}_${hours}_${minutes}`;
  return `routes_${dateStr}.txt`;
}

async function getConfigText(): Promise<string> {
  const response = await fetch(CONFIG_URL);
  const configText = await response.text();
  return configText;
}

async function downloadFile(content: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([content], { type: 'text/plain' });

    const reader = new FileReader();

    reader.onload = function () {
      const dataUrl = reader.result;

      try {
        chrome.downloads.download({
          url: dataUrl as string,
          filename: filename,
          saveAs: true,
        });
      } catch (error) {
        reject(error);
      }

      resolve();
    };

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}
