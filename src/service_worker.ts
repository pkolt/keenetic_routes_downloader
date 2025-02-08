import { getRoutesFromConfig, convertRoutesToText, sortRoutes } from './utils.js';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.startsWith('http://192.168.1.1')) {
      chrome.action.setIcon({ path: 'icon_enabled.png', tabId: tabId });
    } else {
      chrome.action.setIcon({ path: 'icon_disabled.png', tabId: tabId });
    }
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.id && tab.url.startsWith('http://192.168.1.1')) {
    const configUrl = 'http://192.168.1.1/ci/startup-config.txt';
    let configText = '';

    try {
      const response = await fetch(configUrl);
      configText = await response.text();
    } catch (error) {
      console.error(error);
      alert('Не удалось загрузить файл startup-config.txt');
    }

    let routesText = '';

    try {
      const routes = getRoutesFromConfig(configText);
      const orderedRoutes = sortRoutes(routes);
      routesText = convertRoutesToText(orderedRoutes);
    } catch (error) {
      console.error(error);
      alert('Не удалось разобрать файл startup-config.txt');
    }

    try {
      const date = new Date();
      const day = `${date.getDate()}`.padStart(2, '0');
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const year = `${date.getFullYear()}`;
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      const hours = `${date.getHours()}`.padStart(2, '0');
      const dateStr = `${day}_${month}_${year}_${hours}_${minutes}`;
      const filename = `routes_${dateStr}.txt`;
      await downloadFile(routesText, filename);
    } catch (error) {
      console.error(error);
      alert('Не удалось выгрузить файл с маршрутами');
    }
  }
});

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
