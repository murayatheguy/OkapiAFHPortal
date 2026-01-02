import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const DSHS_SEARCH_URL = 'https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx';
const DSHS_RESULTS_URL = 'https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvResults.aspx';

// Browserless.io configuration
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const BROWSERLESS_URL = BROWSERLESS_API_KEY
  ? `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`
  : null;

export interface ScrapedHome {
  licenseNumber: string;
  name: string;
  address: string;
  city: string;
  phone: string;
}

export interface ScrapedInspection {
  date: string;
  type: string;
  violations: number;
  complianceNumbers: string[];
  documentUrl: string | null;
  year: number;
}

export interface ScrapedHomeDetail {
  licenseNumber: string;
  name: string;
  licenseStatus: string;
  licensedCapacity: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  phone: string;
  inspections: ScrapedInspection[];
  scrapedAt: string;
  dataHash: string;
}

const COUNTY_IDS: Record<string, string> = {
  'Adams': 'county_1',
  'Asotin': 'county_2',
  'Benton': 'county_3',
  'Chelan': 'county_4',
  'Clallam': 'county_5',
  'Clark': 'county_6',
  'Columbia': 'county_7',
  'Cowlitz': 'county_8',
  'Douglas': 'county_9',
  'Ferry': 'county_10',
  'Franklin': 'county_11',
  'Garfield': 'county_12',
  'Grant': 'county_13',
  'Grays Harbor': 'county_14',
  'Island': 'county_15',
  'Jefferson': 'county_16',
  'King': 'county_17',
  'Kitsap': 'county_18',
  'Kittitas': 'county_19',
  'Klickitat': 'county_20',
  'Lewis': 'county_21',
  'Lincoln': 'county_22',
  'Mason': 'county_23',
  'Okanogan': 'county_24',
  'Pacific': 'county_25',
  'Pend Oreille': 'county_26',
  'Pierce': 'county_27',
  'San Juan': 'county_28',
  'Skagit': 'county_29',
  'Skamania': 'county_30',
  'Stevens': 'county_31',
  'Snohomish': 'county_32',
  'Spokane': 'county_33',
  'Thurston': 'county_34',
  'Wahkiakum': 'county_35',
  'Walla Walla': 'county_36',
  'Whatcom': 'county_37',
  'Whitman': 'county_38',
  'Yakima': 'county_39'
};

export class DSHSScraper {
  private browser: Browser | null = null;
  private isRemoteBrowser: boolean = false;

  async init(): Promise<void> {
    // Use Browserless.io in production (Railway) or when API key is set
    if (BROWSERLESS_URL) {
      console.log('[DSHS Scraper] Connecting to Browserless.io...');
      this.browser = await puppeteer.connect({
        browserWSEndpoint: BROWSERLESS_URL,
      });
      this.isRemoteBrowser = true;
      console.log('[DSHS Scraper] Connected to Browserless.io successfully');
    } else {
      // Fall back to local Puppeteer for development
      console.log('[DSHS Scraper] Launching local Chromium...');
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--single-process'
        ]
      });
      this.isRemoteBrowser = false;
      console.log('[DSHS Scraper] Local Chromium launched successfully');
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      if (this.isRemoteBrowser) {
        // Disconnect from remote browser (don't close it)
        await this.browser.disconnect();
        console.log('[DSHS Scraper] Disconnected from Browserless.io');
      } else {
        // Close local browser
        await this.browser.close();
        console.log('[DSHS Scraper] Local Chromium closed');
      }
      this.browser = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeCounty(county: string): Promise<ScrapedHome[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
      console.log(`[DSHS Scraper] Navigating to search page for ${county}...`);
      await page.goto(DSHS_SEARCH_URL, { waitUntil: 'networkidle2', timeout: 60000 });

      const countyCheckboxId = COUNTY_IDS[county];
      if (!countyCheckboxId) {
        console.error(`[DSHS Scraper] Unknown county: ${county}`);
        return [];
      }

      await page.waitForSelector(`#${countyCheckboxId}`, { timeout: 10000 });
      await page.click(`#${countyCheckboxId}`);
      
      console.log(`[DSHS Scraper] Checked ${county} county checkbox, submitting form...`);

      const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null),
        page.click('#submit1')
      ]);
      
      console.log(`[DSHS Scraper] Postback completed, waiting for network idle...`);
      
      await page.waitForNetworkIdle({ idleTime: 2000, timeout: 30000 }).catch(() => {
        console.log(`[DSHS Scraper] Network idle wait timed out`);
      });
      
      console.log(`[DSHS Scraper] Getting page content, URL: ${page.url()}`);
      const html = await page.content();
      
      const isErrorPage = html.includes('error') && html.includes('occurred') && html.length < 5000;
      if (isErrorPage) {
        console.log(`[DSHS Scraper] Error page detected, retrying...`);
        return [];
      }
      
      const homes = this.parseSearchResults(html);
      console.log(`[DSHS Scraper] Parsed ${homes.length} homes from results`);
      
      if (homes.length === 0) {
        console.log(`[DSHS Scraper] Page HTML length: ${html.length}`);
        
        const tableMatch = html.match(/<table[^>]*>/gi);
        if (tableMatch) {
          console.log(`[DSHS Scraper] Found ${tableMatch.length} tables`);
        }
        
        const allLinks = html.match(/<a[^>]*href="[^"]*"[^>]*>/gi);
        if (allLinks) {
          console.log(`[DSHS Scraper] Found ${allLinks.length} total links`);
          const relevantLinks = allLinks.filter(l => l.toLowerCase().includes('afh') || l.toLowerCase().includes('detail') || l.toLowerCase().includes('lic'));
          console.log(`[DSHS Scraper] Found ${relevantLinks.length} relevant links`);
          relevantLinks.slice(0, 5).forEach((l, i) => console.log(`  Link ${i}: ${l}`));
        }
        
        const tableStart = html.indexOf('<table class="striped">');
        if (tableStart > 0) {
          const tableSection = html.substring(tableStart, tableStart + 3000);
          console.log(`[DSHS Scraper] Table structure: ${tableSection.replace(/\s+/g, ' ').substring(0, 800)}...`);
        }
        
        const rowSample = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
        if (rowSample && rowSample.length > 1) {
          console.log(`[DSHS Scraper] Sample row (2nd): ${rowSample[1].replace(/\s+/g, ' ').substring(0, 500)}`);
        }
      }
      
      return homes;

    } catch (error) {
      console.error(`[DSHS Scraper] Error scraping ${county}:`, error);
      return [];
    } finally {
      await page.close();
    }
  }

  private parseSearchResults(html: string): ScrapedHome[] {
    const $ = cheerio.load(html);
    const homes: ScrapedHome[] = [];

    $('table.striped tr').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length < 4) return;

      const firstCell = $(cols[0]);
      const cellText = firstCell.text();
      
      const licenseMatch = cellText.match(/License#:\s*(\d+)/i);
      if (!licenseMatch) return;
      
      const licenseNumber = licenseMatch[1];
      
      const nameMatch = firstCell.find('strong').first().text().replace(/^["']|["']$/g, '').trim();
      const name = nameMatch || 'Unknown';
      
      const phoneMatch = cellText.match(/\((\d{3})\)\s*(\d{3})-(\d{4})/);
      const phone = phoneMatch ? `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}` : '';
      
      const lines = cellText.split('\n').map(l => l.trim()).filter(l => l);
      let address = '';
      let city = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(',') && /WA\s+\d{5}/.test(line)) {
          const parts = line.split(',');
          city = parts[0].trim();
          if (i > 0) {
            const prevLine = lines[i - 1];
            if (!prevLine.includes('License#') && !prevLine.includes('Contact') && !prevLine.includes('Region')) {
              address = prevLine;
            }
          }
          break;
        }
      }

      if (licenseNumber && licenseNumber.length >= 5) {
        homes.push({
          licenseNumber,
          name,
          address,
          city,
          phone
        });
      }
    });

    if (homes.length === 0) {
      $('a[href*="AFHServices.aspx?ref=adv&Lic="], a[href*="AFHForms.aspx?Lic="]').each((_, link) => {
        const href = $(link).attr('href') || '';
        const licenseMatch = href.match(/Lic=(\d+)/i);
        if (licenseMatch) {
          const licenseNumber = licenseMatch[1];
          
          if (!homes.find(h => h.licenseNumber === licenseNumber)) {
            homes.push({
              licenseNumber,
              name: 'Unknown',
              address: '',
              city: '',
              phone: ''
            });
          }
        }
      });
    }

    return homes;
  }

  async scrapeHomeDetail(licenseNumber: string): Promise<ScrapedHomeDetail | null> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
      const url = `https://fortress.wa.gov/dshs/adsaapps/lookup/AFHDetail.aspx?id=${licenseNumber}`;
      console.log(`[DSHS Scraper] Fetching detail page for license ${licenseNumber}...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      const html = await page.content();
      const homeDetail = this.parseHomeDetail(html, licenseNumber);

      // Also scrape the forms page for inspection data and facility name
      const { inspections, facilityName } = await this.scrapeInspections(page, licenseNumber);
      homeDetail.inspections = inspections;
      
      // Use facility name from forms page if detail page returned an error
      if (facilityName && (homeDetail.name.includes('Server Error') || homeDetail.name === `AFH ${licenseNumber}`)) {
        homeDetail.name = facilityName;
      }

      // Recalculate hash with inspections included
      const data = { ...homeDetail };
      delete (data as any).dataHash;
      homeDetail.dataHash = crypto
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');

      return homeDetail;

    } catch (error) {
      console.error(`[DSHS Scraper] Error scraping home ${licenseNumber}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  private async scrapeInspections(page: Page, licenseNumber: string): Promise<{ inspections: ScrapedInspection[], facilityName: string | null }> {
    const inspections: ScrapedInspection[] = [];
    let facilityName: string | null = null;
    
    try {
      const formsUrl = `https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=${licenseNumber}`;
      console.log(`[DSHS Scraper] Fetching forms page for license ${licenseNumber}...`);
      await page.goto(formsUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      // Extract facility name from the h1 header (e.g., "AFH Documents & Reports for: #1 AMEN ADULT FAMILY HOME LLC")
      const h1Text = $('h1').first().text().trim();
      const nameMatch = h1Text.match(/for:\s*(.+)$/i);
      if (nameMatch) {
        facilityName = nameMatch[1].trim();
      }
      
      // Look for inspection links in the content_results div
      $('#content_results li a, #content_results a').each((_, link) => {
        const href = $(link).attr('href') || '';
        const linkText = $(link).text().trim();
        
        // Only process inspection-related links
        if (!href.toLowerCase().includes('/inspections/') && 
            !linkText.toLowerCase().includes('inspection')) {
          return;
        }
        
        // Parse date from link text (e.g., "10/2025 - Inspections")
        const dateMatch = linkText.match(/(\d{1,2})\/(\d{4})/);
        let dateStr = '';
        let year = new Date().getFullYear();
        
        if (dateMatch) {
          const month = dateMatch[1].padStart(2, '0');
          year = parseInt(dateMatch[2]);
          dateStr = `${month}/01/${year}`;
        }
        
        // Extract compliance determination numbers from PDF filename
        // Format: "R 1 Amen Adult Family Home LLC 65016 66559 - SW.pdf"
        const complianceNumbers: string[] = [];
        const cdMatch = href.match(/(\d{5,6})/g);
        if (cdMatch) {
          // Filter out the license number and year
          cdMatch.forEach(num => {
            if (num !== licenseNumber && !num.startsWith('20')) {
              complianceNumbers.push(num);
            }
          });
        }
        
        // Determine type from link text
        let type = 'Inspection';
        if (linkText.toLowerCase().includes('investigation')) {
          type = 'Investigation';
        } else if (linkText.toLowerCase().includes('enforcement')) {
          type = 'Enforcement';
        } else if (linkText.toLowerCase().includes('follow')) {
          type = 'Follow-up';
        }
        
        // Build full URL for the document and encode spaces
        let documentUrl = href;
        if (href.startsWith('/')) {
          documentUrl = `https://fortress.wa.gov${href}`;
        }
        // Encode spaces and special characters in the URL
        documentUrl = documentUrl.replace(/ /g, '%20');
        
        inspections.push({
          date: dateStr,
          type,
          violations: 0, // We can't determine this without parsing the PDF
          complianceNumbers,
          documentUrl,
          year
        });
      });
      
      console.log(`[DSHS Scraper] Found ${inspections.length} inspections for license ${licenseNumber}`);
      
    } catch (error) {
      console.error(`[DSHS Scraper] Error scraping inspections for ${licenseNumber}:`, error);
    }
    
    return { inspections, facilityName };
  }

  private parseHomeDetail(html: string, licenseNumber: string): ScrapedHomeDetail {
    const $ = cheerio.load(html);

    const getText = (selectors: string[]): string => {
      for (const selector of selectors) {
        const text = $(selector).text().trim();
        if (text) return text;
      }
      return '';
    };

    const getFieldValue = (labelText: string): string => {
      let value = '';
      
      $('dt, th, td, label, strong, b').each((_, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes(labelText.toLowerCase())) {
          const next = $(el).next('dd, td');
          if (next.length > 0) {
            value = next.text().trim();
            return false;
          }
          
          const parent = $(el).parent();
          const siblings = parent.find('td, dd, span').not(el);
          if (siblings.length > 0) {
            value = siblings.first().text().trim();
            return false;
          }
        }
      });
      
      if (!value) {
        $('tr').each((_, row) => {
          const rowText = $(row).text();
          if (rowText.toLowerCase().includes(labelText.toLowerCase())) {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              value = $(cells[1]).text().trim();
              return false;
            }
          }
        });
      }
      
      return value;
    };

    const extractAddress = (): { address: string; city: string; state: string; zipCode: string } => {
      const fullAddress = getFieldValue('address') || getFieldValue('location');
      
      if (fullAddress) {
        const parts = fullAddress.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const lastPart = parts[parts.length - 1];
          const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5}(-\d{4})?)?/);
          
          return {
            address: parts.slice(0, -1).join(', '),
            city: parts.length >= 3 ? parts[parts.length - 2] : '',
            state: stateZipMatch ? stateZipMatch[1] : 'WA',
            zipCode: stateZipMatch && stateZipMatch[2] ? stateZipMatch[2] : ''
          };
        }
      }
      
      return {
        address: getFieldValue('street') || fullAddress,
        city: getFieldValue('city'),
        state: 'WA',
        zipCode: getFieldValue('zip') || getFieldValue('postal')
      };
    };

    const addressInfo = extractAddress();

    const data: Omit<ScrapedHomeDetail, 'dataHash'> = {
      licenseNumber,
      name: getText(['h1', 'h2', '.facility-name']) || 
            getFieldValue('facility name') || 
            getFieldValue('name') ||
            `AFH ${licenseNumber}`,
      licenseStatus: getFieldValue('status') || getFieldValue('license status') || 'Active',
      licensedCapacity: parseInt(getFieldValue('capacity') || getFieldValue('beds')) || 6,
      address: addressInfo.address,
      city: addressInfo.city,
      state: addressInfo.state,
      zipCode: addressInfo.zipCode,
      county: getFieldValue('county'),
      phone: getFieldValue('phone') || getFieldValue('telephone'),
      inspections: [], // Will be populated by scrapeInspections
      scrapedAt: new Date().toISOString()
    };

    const dataHash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');

    return { ...data, dataHash };
  }
}

export const WA_COUNTIES = [
  'King', 'Pierce', 'Snohomish', 'Spokane', 'Clark', 'Thurston',
  'Kitsap', 'Yakima', 'Whatcom', 'Benton', 'Franklin', 'Cowlitz',
  'Grant', 'Skagit', 'Island', 'Lewis', 'Clallam', 'Chelan',
  'Grays Harbor', 'Mason', 'Walla Walla', 'Whitman', 'Stevens',
  'Okanogan', 'Douglas', 'Kittitas', 'Jefferson', 'Asotin',
  'Pacific', 'Klickitat', 'San Juan', 'Skamania', 'Pend Oreille',
  'Adams', 'Lincoln', 'Ferry', 'Columbia', 'Garfield', 'Wahkiakum'
];
