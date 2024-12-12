from playwright.sync_api import sync_playwright, TimeoutError
import json
import re
import time
from typing import Optional

base_url = 'https://genshin-impact.fandom.com/wiki/Local_Specialty'

def clean_text(text: str) -> str:
    # Remove Chinese/Japanese/Korean characters
    text = re.sub(r'[\u4e00-\u9fff\u3040-\u30ff\u3400-\u4dbf]', '', text)
    # Remove duplicate words and clean spaces
    words = text.split()
    unique_words = []
    seen = set()
    for word in words:
        if word.lower() not in seen:
            seen.add(word.lower())
            unique_words.append(word)
    return ' '.join(unique_words).strip()

def retry_navigation(page, url: str, max_retries: int = 3) -> bool:
    for attempt in range(max_retries):
        try:
            page.goto(url, wait_until=['load', 'domcontentloaded'], timeout=60000)
            # Additional wait for network idle
            page.wait_for_load_state('networkidle', timeout=30000)
            return True
        except Exception as e:
            print(f'Navigation attempt {attempt + 1} failed: {str(e)}')
            if attempt < max_retries - 1:
                time.sleep(5)  # Wait before retry
                continue
            return False

def scrape_items():
    item_data = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=['--disable-dev-shm-usage', '--no-sandbox']
        )
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        page.set_default_timeout(60000)  # Increase default timeout
        
        try:
            print('Navigating to main page...')
            if not retry_navigation(page, base_url):
                raise Exception("Failed to load main page after retries")
            
            print('Waiting for content to load...')
            page.wait_for_selector('.mw-parser-output', state='visible', timeout=30000)
            
            print('Scraping item links...')
            item_links = page.eval_on_selector_all(
                '.mw-parser-output a[href^="/wiki/"]',
                'links => [...new Set(links.map(link => link.href))]'
            )
            
            print(f'Found {len(item_links)} items.')
            
            for index, link in enumerate(item_links, 1):
                print(f'\nScraping item {index}/{len(item_links)}: {link}')
                
                if not retry_navigation(page, link):
                    print(f"Skipping {link} due to navigation failure")
                    continue
                
                # Get item name
                item_name = page.locator('h1.page-header__title').inner_text().strip()
                print(f'Item Name: {item_name}')
                
                translations = {
                    'item': item_name,
                    'English': '',
                    'Japanese': '',
                    'Vietnamese': ''
                }
                
                try:
                    # Wait for table to be visible
                    page.wait_for_selector('table.article-table tbody tr')
                    
                    # Get all rows
                    rows = page.locator('table.article-table tbody tr').all()
                    
                    for row in rows:
                        # Get language cell
                        lang_cell = row.locator('td b').first
                        if not lang_cell:
                            continue
                            
                        language = lang_cell.inner_text().strip()
                        translation_cell = row.locator('td').nth(1)
                        
                        if not translation_cell:
                            continue
                            
                        if language == 'Vietnamese':
                            # Try to get Vietnamese span first
                            vi_span = translation_cell.locator('span[lang="vi"]')
                            if vi_span.count() > 0:
                                translation = vi_span.first.inner_text().strip()
                            else:
                                translation = clean_text(translation_cell.inner_text().strip())
                                
                        elif language == 'Japanese':
                            ja_span = translation_cell.locator('span[lang="ja"]')
                            if ja_span.count() > 0:
                                translation = ja_span.first.inner_text().strip()
                            else:
                                translation = translation_cell.inner_text().strip()
                                
                        elif language == 'English':
                            translation = translation_cell.inner_text().strip()
                        else:
                            continue
                            
                        translations[language] = translation
                        
                except Exception as err:
                    print(f'Failed to scrape translations for {item_name}:', err)
                    
                print('Scraped Data for Item:', translations)
                item_data.append(translations)
                
                # Add longer delay between items
                page.wait_for_timeout(2000)
                
            # Save data to file
            with open('scraped_items.json', 'w', encoding='utf-8') as f:
                json.dump(item_data, f, ensure_ascii=False, indent=2)
                
        except Exception as error:
            print('Error:', error)
        finally:
            browser.close()

if __name__ == '__main__':
    scrape_items()