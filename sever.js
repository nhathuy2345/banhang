const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ==== MOMO CONFIG ====
const PARTNER_CODE = "YOUR_PARTNER_CODE";
const ACCESS_KEY = "YOUR_ACCESS_KEY";
const SECRET_KEY = "YOUR_SECRET_KEY";

const MOMO_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create";
const REDIRECT_URL = "http://localhost:5500/frontend/index.html";
const IPN_URL = "https://YOUR_NGROK_URL/api/momo/ipn";

// ==== FAKE DATABASE ====
const PRODUCTS = [
  {id:1,price:199000},
  {id:2,price:399000},
  {id:3,price:99000}
];

function calcTotal(items){
  return items.reduce((sum,i)=>{
    const p = PRODUCTS.find(x=>x.id===i.id);
    return sum + (p ? p.price*i.qty : 0);
  },0);
}

// ==== CREATE PAYMENT ====
app.post("/api/momo/create-payment", async (req,res)=>{
  try{
    const { items } = req.body;
    const amount = calcTotal(items);
    if(amount<=0) return res.status(400).json({error:"Invalid amount"});

    const orderId = "ORD"+Date.now();
    const raw =
      `accessKey=${ACCESS_KEY}&amount=${amount}&extraData=&ipnUrl=${IPN_URL}`+
      `&orderId=${orderId}&orderInfo=Shop Dien Co 247`+
      `&partnerCode=${PARTNER_CODE}&redirectUrl=${REDIRECT_URL}`+
      `&requestId=${orderId}&requestType=captureWallet`;

    const signature = crypto.createHmac("sha256",SECRET_KEY).update(raw).digest("hex");

    const momoRes = await axios.post(MOMO_ENDPOINT,{
      partnerCode:PARTNER_CODE,
      accessKey:ACCESS_KEY,
      requestId:orderId,
      amount:String(amount),
      orderId,
      orderInfo:"Shop Dien Co 247",
      redirectUrl:REDIRECT_URL,
      ipnUrl:IPN_URL,
      requestType:"captureWallet",
      extraData:"",
      signature,
      lang:"vi"
    });

    res.json({payUrl:momoRes.data.payUrl});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"Server error"});
  }
});

app.post("/api/momo/ipn",(req,res)=>{
  console.log("IPN:",req.body);
  res.json({ok:true});
});

app.listen(3000,()=>console.log("✅ Server chạy cổng 3000"));
