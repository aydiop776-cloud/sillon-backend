// Serveur de paiement pour Sillon — utilise PayDunya
// PayDunya regroupe Wave, Orange Money, Free Money et carte bancaire
// derriere une seule API, ce qui est ideal pour le marche senegalais.

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const SITE_URL = process.env.SITE_URL || 'https://aydiop776-cloud.github.io/sillon-landing';

const PAYDUNYA_URL = 'https://app.paydunya.com/api/v1/checkout-invoice/create';

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { productName, farmName, priceXOF, quantityLabel } = req.body;

    if (!productName || !priceXOF) {
      return res.status(400).json({ error: 'Informations produit manquantes.' });
    }

    const payload = {
      invoice: {
        total_amount: priceXOF,
        description: `${productName}${farmName ? ' - ' + farmName : ''}${quantityLabel ? ' (' + quantityLabel + ')' : ''}`,
      },
      store: {
        name: 'Sillon',
      },
      actions: {
        cancel_url: `${SITE_URL}/index.html`,
        return_url: `${SITE_URL}/success.html`,
        callback_url: `${process.env.BACKEND_URL}/paydunya-webhook`,
      },
    };

    const response = await fetch(PAYDUNYA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN,
        'PAYDUNYA-PUBLIC-KEY': process.env.PAYDUNYA_PUBLIC_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.response_code === '00' && data.token) {
      res.json({ url: `https://paydunya.com/checkout/invoice/${data.token}` });
    } else {
      console.error('Reponse PayDunya inattendue :', data);
      res.status(500).json({ error: data.response_text || 'Impossible de creer le paiement.' });
    }
  } catch (err) {
    console.error('Erreur PayDunya :', err.message);
    res.status(500).json({ error: 'Impossible de creer le paiement.' });
  }
});

app.post('/paydunya-webhook', (req, res) => {
  console.log('Notification PayDunya recue :', req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Serveur de paiement Sillon actif sur le port ${PORT}`));
