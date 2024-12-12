const puppeteer = require('puppeteer');
const fs = require('fs');

const baseUrl = 'https://genshin-impact.fandom.com/wiki/Local_Specialty';

async function scrapeItems() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const itemData = [];
  
  try {
    console.log('Navigating to the main page...');
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    
    console.log('Scraping item links...');
    const itemLinks = await page.$$eval('.mw-parser-output a[href^="/wiki/"]', links =>
      [...new Set(links.map(link => link.href))]
    );
    
    console.log(`Found ${itemLinks.length} items.`);
    
    for (const [index, link] of itemLinks.entries()) {
      console.log(`Scraping item ${index + 1}: ${link}`);
      await page.goto(link, { waitUntil: 'domcontentloaded' });
      
      const itemName = await page.$eval('h1.page-header__title', el => el.textContent.trim());
      console.log(`Item Name: ${itemName}`);
      
      const translations = {
        item: itemName,
        English: '',
        Japanese: '',
        Vietnamese: ''
      };
      
      try {
        // Pass itemName as an argument to $$eval
        const rows = await page.$$eval('table.article-table tbody tr', (trs, currentItemName) => {
          return trs.map(tr => {
            // Get language cell
            const langCell = tr.querySelector('td b');
            if (!langCell) return null;
            const language = langCell.textContent.trim();
            
            // Get translation cell (second td in the row)
            const translationCell = tr.querySelectorAll('td')[1];
            if (!translationCell) return null;
            
            let translation = '';
            
            // For Vietnamese
            if (language === 'Vietnamese') {
              // First try to get span with lang="vi"
              const viSpan = translationCell.querySelector('span[lang="vi"]');
              if (viSpan) {
                translation = viSpan.textContent.trim();
              } else {
                // Get all text content
                translation = translationCell.textContent
                  // Remove any Chinese/Japanese/Korean characters
                  .replace(/[\u4e00-\u9fff\u3040-\u30ff\u3400-\u4dbf]/g, '')
                  // Remove duplicate words (case insensitive)
                  .split(' ')
                  .filter((word, index, arr) => {
                    return arr.findIndex(w => w.toLowerCase() === word.toLowerCase()) === index;
                  })
                  .join(' ')
                  // Clean up extra spaces and trim
                  .replace(/\s+/g, ' ')
                  .trim();
              }
            }
            // For Japanese
            else if (language === 'Japanese') {
              const jaSpan = translationCell.querySelector('span[lang="ja"]');
              if (jaSpan) {
                translation = jaSpan.textContent.trim();
              }
            }
            // For English (direct text content)
            else if (language === 'English') {
              translation = translationCell.textContent.trim();
            }
            
            return { language, translation };
          }).filter(row => row !== null && row.translation);
        }, itemName); // Pass itemName here
        
        // Map the translations to the correct languages
        rows.forEach(row => {
          if (row.language === 'English') {
            translations.English = row.translation;
          } else if (row.language === 'Japanese') {
            translations.Japanese = row.translation;
          } else if (row.language === 'Vietnamese') {
            translations.Vietnamese = row.translation;
          }
        });
        
      } catch (err) {
        console.log(`Failed to scrape "Other Languages" table for ${itemName}:`, err);
      }
      
      console.log('Scraped Data for Item:', translations);
      itemData.push(translations);
    }
    
    // Save all scraped data to a file
    const filePath = 'scraped_items.json';
    fs.writeFileSync(filePath, JSON.stringify(itemData, null, 2));
    console.log(`All data saved to ${filePath}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

scrapeItems();