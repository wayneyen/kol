const express = require('express')
const env = require('dotenv').config()
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const app = express()
const PORT = process.env.PORT || 3000

app.get('/:id', (req, res) => {
  id = req.params.id

  puppeteer.launch({ headless: true }).then(async browser => {
    const kolsUrl = `https://cn.noxinfluencer.com/youtube-channel-rank/top-100-others-all-youtuber-sorted-by-subs-weekly`
    const page = await browser.newPage()
    await page.goto(kolsUrl)
    await page.waitForSelector('#table-body')

    const table = await page.$('#table-body')
    const tableHtml = await page.evaluate(table => table.innerHTML, table)

    const $ = cheerio.load(tableHtml)
    const rows = $('.table-line')
    let data = rows.map((i, row) => {
      const cells = $(row).find('.rank-cell')
      return {
        rank: $(cells[0]).find('.number').text().trim(),
        link: $(cells[1]).find('a').attr('href'),
        name: $(cells[1]).text().trim(),
        category: $(cells[2]).text().trim(),
        subscribers: $(cells[3]).find('.number').text().trim(),
        videoViews: $(cells[4]).find('.number').text().trim(),
      };
    }).get()

    data = data.map(item => {
      item.link = item.link.replace('/youtube/', 'https://www.youtube.com/')
      return item
    })

    res.send(`
      <h1>以下是Top 100 YouTube网红排行榜 from Noxinfluencer</h1>
      <div>
        <table border=1 width="100%">
          <thead>
            <tr>
              <th>排名</th>
              <th>网红名称</th>
              <th>类别</th>
              <th>订阅量</th>
              <th>视频播放量</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                <td>${item.rank}</td>
                <td><a href='${item.link}' target="_blank">${item.name}</a></td>
                <td>${item.category}</td>
                <td>${item.subscribers}</td>
                <td>${item.videoViews}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `)
  })
})

app.listen(PORT, () => {
  console.log(`API is listening on http://localhost:${PORT}`)
})
