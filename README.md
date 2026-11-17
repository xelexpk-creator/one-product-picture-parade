# One Product Picture Parade

heya , i wanna create a single product landing page website , i will provide you the product all images , so can you create that , then i will further modify ur created page by integrating backend for order tracking , and payment method integration ?

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://one-product-picture-parade.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/11ba3c0d-4ae0-483b-a356-b582f6bdc5e4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Order API

The storefront checkout, public tracking page, and `/admin` dashboard use the Express + MongoDB API in the adjacent `backend` folder. Start MongoDB and the backend first, then set `VITE_API_BASE_URL` in `.env` to the backend API URL (default: `http://localhost:4000/api/v1`) and run the storefront.

Admin JWT and optional Cloudinary secrets must be configured only in the backend `.env`; they must never use a `VITE_` prefix. Checkout offers Cash on delivery and Pay Online (bank transfer with a required screenshot). See [the backend setup guide](../backend/README.md) for configuration and the Postman collection.
