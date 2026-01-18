/**
 * Скрипт для очистки кэша приложения
 * Используется для принудительной очистки кэша в случае проблем с инвалидацией
 */

const fs = require('fs');
const path = require('path');

function clearAppCache() {
  console.log('Очистка кэша приложения...');
  
  // Очищаем .next директорию, если она существует
  const nextDir = path.join(__dirname, '../.next');
  if (fs.existsSync(nextDir)) {
    const cacheDir = path.join(nextDir, 'cache');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('Кэш .next очищен');
    }
  }
  
  // Очищаем другие возможные кэши
  const nodeModulesCache = path.join(__dirname, '../node_modules/.cache');
  if (fs.existsSync(nodeModulesCache)) {
    fs.rmSync(nodeModulesCache, { recursive: true, force: true });
    console.log('Кэш node_modules очищен');
  }
  
  console.log('Очистка кэша завершена');
}

if (require.main === module) {
  clearAppCache();
}

module.exports = { clearAppCache };