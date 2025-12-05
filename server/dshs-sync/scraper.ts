import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const DSHS_SEARCH_URL = 'https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx';
const DSHS_DETAIL_URL = 'https://fortress.wa.gov/dshs/adsaapps/lookup/AFHDetail.aspx';

export interface ScrapedHome {
  licenseNumber: string;
  name: string;
  address: string;
  city: string;
  phone: string;
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
  inspections: {
    date: string;
    type: string;
    violations: number;
  }[];
  scrapedAt: string;
  dataHash: string;
}

export class DSHSScraper {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--single-process'
      ]
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeCounty(county: string): Promise<ScrapedHome[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
      console.log(`[DSHS Scraper] Navigating to search page for ${county}...`);
      await page.goto(DSHS_SEARCH_URL, { waitUntil: 'networkidle2', timeout: 60000 });

      await page.select('#ddlCounty', county);

      await Promise.all([
        page.click('#btnSearch'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
      ]);

      const html = await page.content();
      return this.parseSearchResults(html);

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

    $('table.gridview tr, #gvSearchResults tr').each((i, row) => {
      if (i === 0) return;

      const cols = $(row).find('td');
      if (cols.length < 4) return;

      const licenseLink = $(cols[0]).find('a');
      const href = licenseLink.attr('href') || '';
      const licenseMatch = href.match(/id=(\d+)/i) || href.match(/(\d{6})/);

      if (licenseMatch) {
        homes.push({
          licenseNumber: licenseMatch[1],
          name: $(cols[1]).text().trim() || $(cols[0]).text().trim(),
          address: $(cols[2]).text().trim(),
          city: $(cols[3]).text().trim(),
          phone: cols.length > 4 ? $(cols[4]).text().trim() : ''
        });
      }
    });

    return homes;
  }

  async scrapeHomeDetail(licenseNumber: string): Promise<ScrapedHomeDetail | null> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
      const url = `${DSHS_DETAIL_URL}?id=${licenseNumber}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      const html = await page.content();
      return this.parseHomeDetail(html, licenseNumber);

    } catch (error) {
      console.error(`[DSHS Scraper] Error scraping home ${licenseNumber}:`, error);
      return null;
    } finally {
      await page.close();
    }
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

    const getTableValue = (label: string): string => {
      let value = '';
      $('table tr, .detail-row').each((_, row) => {
        const rowText = $(row).text();
        if (rowText.toLowerCase().includes(label.toLowerCase())) {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            value = $(cells[1]).text().trim();
          }
        }
      });
      return value;
    };

    const data: Omit<ScrapedHomeDetail, 'dataHash'> = {
      licenseNumber,
      name: getText(['#lblFacilityName', '.facility-name', '#ContentPlaceHolder1_lblName']) || 
            getTableValue('facility name') || getTableValue('name'),
      licenseStatus: getText(['#lblStatus', '#ContentPlaceHolder1_lblStatus']) || 
                     getTableValue('status') || 'Active',
      licensedCapacity: parseInt(getText(['#lblCapacity', '#ContentPlaceHolder1_lblCapacity']) || 
                                 getTableValue('capacity')) || 6,
      address: getText(['#lblAddress', '#ContentPlaceHolder1_lblAddress']) || getTableValue('address'),
      city: getText(['#lblCity', '#ContentPlaceHolder1_lblCity']) || getTableValue('city'),
      state: 'WA',
      zipCode: getText(['#lblZip', '#ContentPlaceHolder1_lblZip']) || getTableValue('zip'),
      county: getText(['#lblCounty', '#ContentPlaceHolder1_lblCounty']) || getTableValue('county'),
      phone: getText(['#lblPhone', '#ContentPlaceHolder1_lblPhone']) || getTableValue('phone'),
      inspections: [],
      scrapedAt: new Date().toISOString()
    };

    $('#tblInspections tr, .inspection-row, #gvInspections tr').each((i, row) => {
      if (i === 0) return;
      const cols = $(row).find('td');
      if (cols.length >= 2) {
        data.inspections.push({
          date: $(cols[0]).text().trim(),
          type: $(cols[1]).text().trim(),
          violations: parseInt($(cols[2]).text().trim()) || 0
        });
      }
    });

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
