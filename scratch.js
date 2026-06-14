import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"></script>
        <script>
          function getSV() {
            return new Promise((resolve) => {
              const sv = new google.maps.StreetViewService();
              sv.getPanorama({ location: { lat: 40.758896, lng: -73.985130 }, radius: 50 }, (data, status) => {
                resolve(data);
              });
            });
          }
        </script>
      </head>
      <body></body>
    </html>
  `);
  
  // Wait for Google Maps API to load
  await page.waitForFunction('window.google && window.google.maps && window.google.maps.StreetViewService');
  
  const data = await page.evaluate(() => window.getSV());
  console.log(JSON.stringify(data.time, null, 2));
  
  await browser.close();
})();
