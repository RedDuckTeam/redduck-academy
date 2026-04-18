import puppeteer, { type Browser } from 'puppeteer'

let browser: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
  }
  return browser
}
