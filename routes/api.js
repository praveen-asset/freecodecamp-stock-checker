'use strict';

const StockModel = require("../models/stock").Stock
const fetch = require("node-fetch")

async function createStock(stock, like, ip) {
    const newStock = new StockModel({
      symbol: stock,
      likes: like ? [ip] : []
    })
    const newData = await newStock.save()
    return newData
}

async function findStock(stock){
  return await StockModel.findOne({symbol: stock}).exec()
}

async function saveStock(stock, like, ip) {
  let saveData = {}
  const foundStock = await findStock(stock)
  if(!foundStock) {
    const createdNewData = await createStock(stock, like, ip)
    return createdNewData
  } {
    if(like && foundStock.likes.indexOf(ip) === -1){
      foundStock.likes.push(ip)
    }
    return await foundStock.save()
  }
}

async function getStock(stock) {
  const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`)
  const {symbol, latestPrice} = await response.json()
  return {symbol, latestPrice}
}

async function multiple_stock_data(stock, like, ip) {
  const {symbol, latestPrice} = await getStock(stock[0])
  const {symbol: symbol2, latestPrice: latestPrice2} = await getStock(stock[1])

  const firstStockData = await saveStock(stock[0], like, ip)
  const secondStockData = await saveStock(stock[1], like, ip)

  let stockData = []
  if(!symbol) {
    stockData.push({
      rel_likes: firstStockData.likes.length - secondStockData.likes.length
    })
  } else {
    stockData.push({
      stock: symbol,
      price: latestPrice,
      rel_likes: firstStockData.likes.length - secondStockData.likes.length
    })
  }

  if(!symbol2) {
    stockData.push({
      rel_likes: secondStockData.likes.length - firstStockData.likes.length
    })
  } else {
    stockData.push({
      stock: symbol2,
      price: latestPrice2,
      rel_likes: secondStockData.likes.length - firstStockData.likes.length
    })
  }

  return stockData
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      const {stock, like} = req.query

      if(Array.isArray(stock)) {
         const stockData = await multiple_stock_data(stock, like, req.ip)
         res.json({stockData})
         return
      }

      const {symbol, latestPrice} = await getStock(stock)
      if(!symbol) {
        res.json({stockData: {likes: like ? 1 : 0 }})
      }
      const oneStockData = await saveStock(symbol, like, req.ip)
      res.json({stockData: {stock: symbol, price: latestPrice, likes: oneStockData.likes.length }})
    });
    
};
