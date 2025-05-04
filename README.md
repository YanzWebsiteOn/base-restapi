<h1 align="center">🚀 Simple Base REST API</h1><p align="center">
  REST API berbasis Express.js yang dirancang untuk <strong>skabilitas</strong>, <strong>performa tinggi</strong>, dan <strong>kemudahan penggunaan</strong>.
</p><p align="center">
  <img src="https://img.shields.io/badge/Express.js-4.x-blue.svg" />
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" />
</p>
---

## 📂 Project Structure

```
base-restapi/
├── api/
│   ├── ai/
│   │   └── hydromind.js      # API Feature endpoint
│   └── maker/
│       └── brat.js            # API Feature Maker endpoint
│
├── public/                    # Static assets served by Express
│   ├── css/
│   │   ├── monitor.css
│   │   ├── style.css         # stylesheet css
│   │   └── report.css         
│   └── js/
│       ├─── monitor.js        # Back-end helper scripts
│       └── report.js
│
├── views/
│   ├── api.json                # JSON Status documentation of API routes
│   ├── documentation.html       
│   ├── index.html              # Front-end html
│   ├── monitor.html
│   └── report.html
│
├── app.js                      # App entry point
├── apiMonitor.js               # API request logging
├── package.json                # Project metadata & dependencies
└── README.md                   # Project documentation
```

---

## ⚙️ Getting Started

Untuk memulai, klon repositori ini ke terminal Anda dan instal:

```bash
git clone https://github.com/ArixOffc/base-restapi.git
cd base-restapi
npm install
node index.js
```

Server API akan berjalan di [http://localhost:3000](http://localhost:3000) default.

---

## ➕ Adding A New Endpoint

Menambahkan endpoint berikut cara melakukannya:

1. **Buat folder kategori baru** contoh `/api` (e.g., `ai`, `tools`, `downloader`, etc.):

```bash
mkdir api/ai   # Example
```

2. **Tambahkan file baru** di dalam folder itu, contoh`hydromind.js`, dan strukturkan endpoint seperti ini:

```js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const apiMonitor = require('../../apiMonitor');

router.get('/hydromind', async (req, res) => {
    const { text, model } = req.query;
    if (!text || !model) {
        return res.status(400).json({
            error: 'text and model parameter is required. See supported models: https://mind.hydrooo.web.id'
        });
    }

    try {
        const response = await hydromind(text, model);
        apiMonitor.recordSuccess('/api/ai/hydromind');
        res.json(response);
    } catch (error) {
        apiMonitor.recordFailure('/api/ai/hydromind');
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || 'Error processing request to HydroMind.';
        res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

async function hydromind(content, model) {
    const form = new FormData();
    form.append('content', content);
    form.append('model', model);
    const { data } = await axios.post('https://mind.hydrooo.web.id/v1/chat/', form, {
        headers: {
            ...form.getHeaders(),
        }
    });
    return data;
}

module.exports = router;
```

3. **Perbarui `/views/api.json` file** dengan endpoint baru kamu sehingga muncul dalam respon API:
```json
{
    "status": true,
    "api": [
        {
            "kategory": "AI",
            "endpoint": [
                {
                    "path": "/api/ai/lumin",
                    "method": "GET",
                    "parameter": [
                        "content"
                    ],
                    "description": "Lumin Ai"
                },
                {
                    "path": "/api/ai/hydromind",
                    "method": "GET",
                    "parameter": [
                        "text"
                    ],
                    "description": "hydromind AI endpoint"
                }
            ]
        },
        {
            "kategory": "maker",
            "endpoint": [
                {
                    "path": "/api/maker/brat",
                    "method": "GET",
                    "parameter": [
                        "text"
                    ],
                    "description": "Anomali Image Brat Meme"
                }
            ]
        }
    ]

```

---

## 🔍 Saran Website Pengujian API yang Direkomendasikan

Website ini memudahkan pengujian dan interaksi dengan endpoint API :
- [Postman](https://www.postman.com/)
- [Hoppscotch](https://hoppscotch.io/)
- [Insomnia](https://insomnia.rest/)

---

## 🧠 Tips Untuk Development

- Gunakan **`.env`** file untuk menjaga informasi sensitif seperti keamanan API tetap aman.
- Use **`nodemon`** untuk memulai ulang otomatis saat mengembangkan:

```bash
npx nodemon index.js
```
---

## 🤝 Contributing

Kami Menerima Pull Request, Commit, Issues Untuk kontribusi Jika Anda menemukan bug Atau Penyesuaian 
---

## 📝 License

Comming Soon

---
